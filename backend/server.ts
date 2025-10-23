import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

// Import Zod schemas
import {
  userEntitySchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUserInputSchema,
  postEntitySchema,
  createPostInputSchema,
  updatePostInputSchema,
  searchPostInputSchema,
  commentEntitySchema,
  createCommentInputSchema,
  updateCommentInputSchema,
  searchCommentInputSchema,
  likeEntitySchema,
  createLikeInputSchema,
  searchLikeInputSchema
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432,
  JWT_SECRET = 'your-secret-key',
  PORT = 3000
} = process.env;

// PostgreSQL connection
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Express app setup
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Error response utility
function createErrorResponse(message, error = null, errorCode = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

/*
  JWT Authentication middleware
  Validates Bearer tokens and attaches user info to req.user
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, username, email, full_name, profile_image_url, created_at FROM users WHERE id = $1', 
      [decoded.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token - user not found', null, 'AUTH_USER_NOT_FOUND'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

// Auth Routes

/*
  User Registration Endpoint
  Creates new user account with email/password
  Returns user info and JWT token for immediate login
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedInput = createUserInputSchema.parse(req.body);
    const { username, email, password_hash, full_name, profile_image_url } = validatedInput;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2', 
      [email.toLowerCase().trim(), username.trim()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email or username already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user (storing password directly for development)
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, profile_image_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, full_name, profile_image_url, created_at`,
      [
        username.trim(),
        email.toLowerCase().trim(),
        password_hash, // Direct storage for development
        full_name?.trim() || null,
        profile_image_url || `https://picsum.photos/200/300?random=${Math.floor(Math.random() * 1000)}`
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        password_hash: undefined, // Don't return password
        full_name: user.full_name,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at.toISOString()
      },
      auth_token
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  User Login Endpoint
  Authenticates user with email/password
  Returns user info and JWT token
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user (direct password comparison for development)
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email.toLowerCase().trim()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Check password (direct comparison for development)
    if (password_hash !== user.password_hash) {
      return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT token
    const auth_token = jwt.sign(
      { user_id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        password_hash: undefined, // Don't return password
        full_name: user.full_name,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at.toISOString()
      },
      auth_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// User Routes

/*
  List Users with Search and Pagination
  Supports query search across username, email, full_name
  Includes sorting and pagination parameters
*/
app.get('/api/users', async (req, res) => {
  try {
    // Validate query parameters using Zod schema
    const searchParams = searchUserInputSchema.parse(req.query);
    const { query, limit, offset, sort_by, sort_order } = searchParams;

    let sqlQuery = `
      SELECT id, username, email, full_name, profile_image_url, created_at 
      FROM users
    `;
    const queryParams = [];
    
    // Add search functionality
    if (query && query.trim()) {
      sqlQuery += ` WHERE (username ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1} OR full_name ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${query.trim()}%`);
    }

    // Add sorting
    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Add pagination
    sqlQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(sqlQuery, queryParams);
    
    const users = result.rows.map(user => ({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      password_hash: undefined, // Don't return password
      full_name: user.full_name,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at.toISOString()
    }));

    res.json(users);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('List users error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create User Endpoint (Alternative to register)
  Creates new user account
*/
app.post('/api/users', async (req, res) => {
  try {
    const validatedInput = createUserInputSchema.parse(req.body);
    const { username, email, password_hash, full_name, profile_image_url } = validatedInput;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2', 
      [email.toLowerCase().trim(), username.trim()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email or username already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, profile_image_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, full_name, profile_image_url, created_at`,
      [
        username.trim(),
        email.toLowerCase().trim(),
        password_hash,
        full_name?.trim() || null,
        profile_image_url || `https://picsum.photos/200/300?random=${Math.floor(Math.random() * 1000)}`
      ]
    );

    const user = result.rows[0];

    res.status(201).json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      password_hash: undefined,
      full_name: user.full_name,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Create user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get User by ID
  Retrieves specific user information by user ID
*/
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const result = await pool.query(
      'SELECT id, username, email, full_name, profile_image_url, created_at FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];
    res.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      password_hash: undefined,
      full_name: user.full_name,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at.toISOString()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update User Profile
  Updates user information (requires authentication)
*/
app.put('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedInput = updateUserInputSchema.parse(req.body);

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    // Build dynamic update query
    const updateFields = [];
    const queryParams = [];
    let paramCount = 1;

    if (validatedInput.username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      queryParams.push(validatedInput.username.trim());
    }
    if (validatedInput.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      queryParams.push(validatedInput.email.toLowerCase().trim());
    }
    if (validatedInput.password_hash !== undefined) {
      updateFields.push(`password_hash = $${paramCount++}`);
      queryParams.push(validatedInput.password_hash);
    }
    if (validatedInput.full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount++}`);
      queryParams.push(validatedInput.full_name?.trim() || null);
    }
    if (validatedInput.profile_image_url !== undefined) {
      updateFields.push(`profile_image_url = $${paramCount++}`);
      queryParams.push(validatedInput.profile_image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    queryParams.push(user_id);
    const sqlQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, profile_image_url, created_at
    `;

    const result = await pool.query(sqlQuery, queryParams);
    const user = result.rows[0];

    res.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      password_hash: undefined,
      full_name: user.full_name,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Update user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete User Account
  Removes user and all associated data (requires authentication)
*/
app.delete('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [user_id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Posts Routes

/*
  List Posts with Search and Pagination
  Supports query search and user filtering
  Includes sorting and pagination parameters
*/
app.get('/api/posts', async (req, res) => {
  try {
    const searchParams = searchPostInputSchema.parse(req.query);
    const { query, user_id, limit, offset, sort_by, sort_order } = searchParams;

    let sqlQuery = `
      SELECT id, user_id, title, content, image_url, created_at 
      FROM posts
    `;
    const queryParams = [];
    const whereConditions = [];

    // Add search functionality
    if (query && query.trim()) {
      whereConditions.push(`(title ILIKE $${queryParams.length + 1} OR content ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${query.trim()}%`);
    }

    // Add user filter
    if (user_id) {
      whereConditions.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add sorting
    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Add pagination
    sqlQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(sqlQuery, queryParams);
    
    const posts = result.rows.map(post => ({
      id: post.id.toString(),
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at.toISOString()
    }));

    res.json(posts);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('List posts error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create New Post
  Creates a new post with title, content, and optional image
*/
app.post('/api/posts', async (req, res) => {
  try {
    const validatedInput = createPostInputSchema.parse(req.body);
    const { user_id, title, content, image_url } = validatedInput;

    // Verify user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, title, content, image_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, user_id, title, content, image_url, created_at`,
      [
        user_id,
        title.trim(),
        content?.trim() || null,
        image_url || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
      ]
    );

    const post = result.rows[0];
    res.status(201).json({
      id: post.id.toString(),
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Create post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get Post by ID
  Retrieves specific post information by post ID
*/
app.get('/api/posts/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    
    const result = await pool.query(
      'SELECT id, user_id, title, content, image_url, created_at FROM posts WHERE id = $1',
      [post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    const post = result.rows[0];
    res.json({
      id: post.id.toString(),
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at.toISOString()
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update Post
  Updates post information
*/
app.put('/api/posts/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    const validatedInput = updatePostInputSchema.parse(req.body);

    // Check if post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    // Build dynamic update query
    const updateFields = [];
    const queryParams = [];
    let paramCount = 1;

    if (validatedInput.user_id !== undefined) {
      updateFields.push(`user_id = $${paramCount++}`);
      queryParams.push(validatedInput.user_id);
    }
    if (validatedInput.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      queryParams.push(validatedInput.title.trim());
    }
    if (validatedInput.content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      queryParams.push(validatedInput.content?.trim() || null);
    }
    if (validatedInput.image_url !== undefined) {
      updateFields.push(`image_url = $${paramCount++}`);
      queryParams.push(validatedInput.image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    queryParams.push(post_id);
    const sqlQuery = `
      UPDATE posts 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, user_id, title, content, image_url, created_at
    `;

    const result = await pool.query(sqlQuery, queryParams);
    const post = result.rows[0];

    res.json({
      id: post.id.toString(),
      user_id: post.user_id.toString(),
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Update post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete Post
  Removes post and all associated data
*/
app.delete('/api/posts/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    
    // Check if post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    // Delete post (cascade will handle related records)
    await pool.query('DELETE FROM posts WHERE id = $1', [post_id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Comments Routes

/*
  List Comments with Search and Pagination
  Supports query search and user/post filtering
*/
app.get('/api/comments', async (req, res) => {
  try {
    const searchParams = searchCommentInputSchema.parse(req.query);
    const { query, user_id, post_id, limit, offset, sort_by, sort_order } = searchParams;

    let sqlQuery = `
      SELECT id, user_id, post_id, content, created_at 
      FROM comments
    `;
    const queryParams = [];
    const whereConditions = [];

    // Add search functionality
    if (query && query.trim()) {
      whereConditions.push(`content ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${query.trim()}%`);
    }

    // Add user filter
    if (user_id) {
      whereConditions.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    // Add post filter
    if (post_id) {
      whereConditions.push(`post_id = $${queryParams.length + 1}`);
      queryParams.push(post_id);
    }

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add sorting
    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Add pagination
    sqlQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(sqlQuery, queryParams);
    
    const comments = result.rows.map(comment => ({
      id: comment.id.toString(),
      user_id: comment.user_id.toString(),
      post_id: comment.post_id.toString(),
      content: comment.content,
      created_at: comment.created_at.toISOString()
    }));

    res.json(comments);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('List comments error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create New Comment
  Creates a new comment on a post
*/
app.post('/api/comments', async (req, res) => {
  try {
    const validatedInput = createCommentInputSchema.parse(req.body);
    const { user_id, post_id, content } = validatedInput;

    // Verify user and post exist
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    const result = await pool.query(
      `INSERT INTO comments (user_id, post_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, user_id, post_id, content, created_at`,
      [user_id, post_id, content.trim()]
    );

    const comment = result.rows[0];
    res.status(201).json({
      id: comment.id.toString(),
      user_id: comment.user_id.toString(),
      post_id: comment.post_id.toString(),
      content: comment.content,
      created_at: comment.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Create comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get Comment by ID
  Retrieves specific comment information by comment ID
*/
app.get('/api/comments/:comment_id', async (req, res) => {
  try {
    const { comment_id } = req.params;
    
    const result = await pool.query(
      'SELECT id, user_id, post_id, content, created_at FROM comments WHERE id = $1',
      [comment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }

    const comment = result.rows[0];
    res.json({
      id: comment.id.toString(),
      user_id: comment.user_id.toString(),
      post_id: comment.post_id.toString(),
      content: comment.content,
      created_at: comment.created_at.toISOString()
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update Comment
  Updates comment content
*/
app.put('/api/comments/:comment_id', async (req, res) => {
  try {
    const { comment_id } = req.params;
    const validatedInput = updateCommentInputSchema.parse(req.body);

    // Check if comment exists
    const commentCheck = await pool.query('SELECT id FROM comments WHERE id = $1', [comment_id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }

    // Build dynamic update query
    const updateFields = [];
    const queryParams = [];
    let paramCount = 1;

    if (validatedInput.user_id !== undefined) {
      updateFields.push(`user_id = $${paramCount++}`);
      queryParams.push(validatedInput.user_id);
    }
    if (validatedInput.post_id !== undefined) {
      updateFields.push(`post_id = $${paramCount++}`);
      queryParams.push(validatedInput.post_id);
    }
    if (validatedInput.content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      queryParams.push(validatedInput.content?.trim() || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    queryParams.push(comment_id);
    const sqlQuery = `
      UPDATE comments 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, user_id, post_id, content, created_at
    `;

    const result = await pool.query(sqlQuery, queryParams);
    const comment = result.rows[0];

    res.json({
      id: comment.id.toString(),
      user_id: comment.user_id.toString(),
      post_id: comment.post_id.toString(),
      content: comment.content,
      created_at: comment.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Update comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete Comment
  Removes comment
*/
app.delete('/api/comments/:comment_id', async (req, res) => {
  try {
    const { comment_id } = req.params;
    
    // Check if comment exists
    const commentCheck = await pool.query('SELECT id FROM comments WHERE id = $1', [comment_id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Comment not found', null, 'COMMENT_NOT_FOUND'));
    }

    // Delete comment
    await pool.query('DELETE FROM comments WHERE id = $1', [comment_id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Likes Routes

/*
  List Likes with Filtering and Pagination
  Supports user and post filtering
*/
app.get('/api/likes', async (req, res) => {
  try {
    const searchParams = searchLikeInputSchema.parse(req.query);
    const { user_id, post_id, limit, offset, sort_by, sort_order } = searchParams;

    let sqlQuery = `
      SELECT user_id, post_id, created_at 
      FROM likes
    `;
    const queryParams = [];
    const whereConditions = [];

    // Add user filter
    if (user_id) {
      whereConditions.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    // Add post filter
    if (post_id) {
      whereConditions.push(`post_id = $${queryParams.length + 1}`);
      queryParams.push(post_id);
    }

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add sorting
    sqlQuery += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    
    // Add pagination
    sqlQuery += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(sqlQuery, queryParams);
    
    const likes = result.rows.map(like => ({
      user_id: like.user_id.toString(),
      post_id: like.post_id.toString(),
      created_at: like.created_at.toISOString()
    }));

    res.json(likes);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('List likes error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create New Like
  Creates a new like on a post
*/
app.post('/api/likes', async (req, res) => {
  try {
    const validatedInput = createLikeInputSchema.parse(req.body);
    const { user_id, post_id } = validatedInput;

    // Verify user and post exist
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Post not found', null, 'POST_NOT_FOUND'));
    }

    // Check if like already exists
    const existingLike = await pool.query(
      'SELECT user_id, post_id FROM likes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );
    
    if (existingLike.rows.length > 0) {
      return res.status(400).json(createErrorResponse('Like already exists', null, 'LIKE_ALREADY_EXISTS'));
    }

    const result = await pool.query(
      `INSERT INTO likes (user_id, post_id) 
       VALUES ($1, $2) 
       RETURNING user_id, post_id, created_at`,
      [user_id, post_id]
    );

    const like = result.rows[0];
    res.status(201).json({
      user_id: like.user_id.toString(),
      post_id: like.post_id.toString(),
      created_at: like.created_at.toISOString()
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Validation error', error, 'VALIDATION_ERROR'));
    }
    console.error('Create like error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete Like
  Removes like from a post
*/
app.delete('/api/likes/:user_id/:post_id', async (req, res) => {
  try {
    const { user_id, post_id } = req.params;
    
    // Check if like exists
    const likeCheck = await pool.query(
      'SELECT user_id, post_id FROM likes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );
    
    if (likeCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Like not found', null, 'LIKE_NOT_FOUND'));
    }

    // Delete like
    await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [user_id, post_id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete like error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app and pool for testing/external use
export { app, pool };

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 eco3 server running on port ${PORT} and listening on 0.0.0.0`);
  console.log(`📊 Database connected: ${PGDATABASE || 'Not specified'}`);
  console.log(`🔐 JWT Secret configured: ${JWT_SECRET ? 'Yes' : 'No'}`);
});