import { app, pool } from './server';
import supertest from 'supertest';
import { UserEntity, PostEntity, CommentEntity, LikeEntity } from './zodSchemas';
import { z } from 'zod';

const request = supertest(app);

// Test user for authentication
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'password123'
};

// Test post
const testPost = {
  user_id: '1',
  title: 'Test Post',
  content: 'This is a test post'
};

// Test comment
const testComment = {
  user_id: '1',
  post_id: '1',
  content: 'Test comment'
};

describe('Backend Integration Tests', () => {
  beforeEach(async () => {
    // Clear database before each test
    await pool.query('DELETE FROM likes; DELETE FROM comments; DELETE FROM posts; DELETE FROM users;');
    // Insert test user
    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
      [testUser.username, testUser.email, testUser.password_hash]
    );
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request
       .post('/auth/register')
       .send({
          username: 'newuser',
          email: 'new@example.com',
          password_hash: 'newpassword'
        });
      
      expect(response.statusCode).toBe(201);
      expect(response.body.user).toMatchSchema(UserEntity);
    });

    it('should login existing user', async () => {
      const response = await request
       .post('/auth/login')
       .send({
          email: testUser.email,
          password_hash: testUser.password_hash
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.user).toMatchSchema(UserEntity);
      expect(response.body.auth_token).toBeDefined();
    });

    it('should reject invalid login', async () => {
      const response = await request
       .post('/auth/login')
       .send({
          email: 'invalid@example.com',
          password_hash: 'wrongpassword'
        });
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('User CRUD Operations', () => {
    it('should create a new user', async () => {
      const response = await request
       .post('/users')
       .send({
          username: 'createuser',
          email: 'create@example.com',
          password_hash: 'createpassword'
        });
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchSchema(UserEntity);
    });

    it('should retrieve user list', async () => {
      const response = await request.get('/users');
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeArray();
      response.body.forEach(user => expect(user).toMatchSchema(UserEntity));
    });

    it('should update user profile', async () => {
      // First get the user
      const getUserResponse = await request.get('/users');
      const user = getUserResponse.body[0];
      
      const response = await request
       .put(`/users/${user.id}`)
       .send({
          full_name: 'Updated Name',
          profile_image_url: 'https://example.com/image.jpg'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.full_name).toBe('Updated Name');
    });
  });

  describe('Post Operations', () => {
    it('should create a new post', async () => {
      // First authenticate
      const loginResponse = await request
       .post('/auth/login')
       .send(testUser);
      
      const response = await request
       .post('/posts')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send(testPost);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchSchema(PostEntity);
    });

    it('should retrieve posts with pagination', async () => {
      const response = await request.get('/posts?limit=5&offset=0');
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeArray();
      response.body.forEach(post => expect(post).toMatchSchema(PostEntity));
    });

    it('should delete a post', async () => {
      // Create a post first
      const loginResponse = await request
       .post('/auth/login')
       .send(testUser);
      
      const createPostResponse = await request
       .post('/posts')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send(testPost);
      
      const deleteResponse = await request
       .delete(`/posts/${createPostResponse.body.id}`)
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`);
      
      expect(deleteResponse.statusCode).toBe(204);
    });
  });

  describe('Comment Operations', () => {
    it('should create, read, and delete comments', async () => {
      // Authenticate
      const loginResponse = await request
       .post('/auth/login')
       .send(testUser);
      
      // Create a post first
      const createPostResponse = await request
       .post('/posts')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send(testPost);
      
      // Create comment
      const createCommentResponse = await request
       .post('/comments')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send({
         ...testComment,
          post_id: createPostResponse.body.id
        });
      
      expect(createCommentResponse.statusCode).toBe(201);
      expect(createCommentResponse.body).toMatchSchema(CommentEntity);
      
      // Get comments
      const getCommentsResponse = await request.get('/comments');
      expect(getCommentsResponse.statusCode).toBe(200);
      
      // Delete comment
      const deleteResponse = await request
       .delete(`/comments/${createCommentResponse.body.id}`)
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`);
      
      expect(deleteResponse.statusCode).toBe(204);
    });
  });

  describe('Like Operations', () => {
    it('should create and delete likes', async () => {
      // Authenticate
      const loginResponse = await request
       .post('/auth/login')
       .send(testUser);
      
      // Create a post first
      const createPostResponse = await request
       .post('/posts')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send(testPost);
      
      // Create like
      const createLikeResponse = await request
       .post('/likes')
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`)
       .send({
          user_id: testUser.id,
          post_id: createPostResponse.body.id
        });
      
      expect(createLikeResponse.statusCode).toBe(201);
      expect(createLikeResponse.body).toMatchSchema(LikeEntity);
      
      // Delete like
      const deleteResponse = await request
       .delete(`/likes/${testUser.id}/${createPostResponse.body.id}`)
       .set("Authorization", `Bearer ${loginResponse.body.auth_token}`);
      
      expect(deleteResponse.statusCode).toBe(204);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input', async () => {
      // Test user creation with invalid email
      const response = await request
       .post('/auth/register')
       .send({
          username: 'invalid',
          email: 'invalid-email',
          password_hash: 'pass'
        });
      
      expect(response.statusCode).toBe(400);
    });

    it('should handle non-existent resources', async () => {
      const response = await request.get('/users/999999');
      expect(response.statusCode).toBe(404);
    });
  });
});