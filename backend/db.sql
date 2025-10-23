-- Create Tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    profile_image_url TEXT DEFAULT 'https://picsum.photos/200/300?random=1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url TEXT DEFAULT 'https://picsum.photos/800/600?random=1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    PRIMARY KEY (user_id, post_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT INTO users (username, email, password_hash, full_name, profile_image_url)
VALUES 
    ('john_doe', 'john@example.com', 'password123', 'John Doe', 'https://picsum.photos/200/300?random=42'),
    ('jane_smith', 'jane@example.com', 'admin123', 'Jane Smith', 'https://picsum.photos/200/300?random=17'),
    ('tech_guy', 'tech@example.com', 'user123', 'Tech Enthusiast', 'https://picsum.photos/200/300?random=88'),
    ('travel_lover', 'travel@example.com', 'travel123', 'Travel Lover', 'https://picsum.photos/200/300?random=33'),
    ('foodie', 'food@example.com', 'food123', 'Foodie Fan', 'https://picsum.photos/200/300?random=75');

INSERT INTO posts (user_id, title, content, image_url)
VALUES 
    (1, 'First Post', 'This is my first post about PostgreSQL!', 'https://picsum.photos/800/600?random=10'),
    (1, 'Database Tips', 'Always normalize your database design!', 'https://picsum.photos/800/600?random=25'),
    (2, 'Hello World', 'Starting my journey with PostgreSQL', 'https://picsum.photos/800/600?random=50'),
    (3, 'Tech Review', 'Review of the latest PostgreSQL features', 'https://picsum.photos/800/600?random=75'),
    (4, 'Travel Diary', 'Exploring new places with PostgreSQL in mind', 'https://picsum.photos/800/600?random=90'),
    (5, 'Food Adventures', 'Cooking with SQL', 'https://picsum.photos/800/600?random=3');

INSERT INTO comments (user_id, post_id, content)
VALUES 
    (2, 1, 'Great first post!'),
    (3, 1, 'Very informative'),
    (1, 3, 'Thanks for sharing!'),
    (4, 2, 'Useful tips'),
    (5, 4, 'Looking forward to more reviews'),
    (2, 5, 'Amazing travel stories'),
    (1, 6, 'Yummy content!');

INSERT INTO likes (user_id, post_id)
VALUES 
    (2, 1),
    (3, 1),
    (4, 2),
    (1, 3),
    (5, 4),
    (2, 5),
    (3, 6);