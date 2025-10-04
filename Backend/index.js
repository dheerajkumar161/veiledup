require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRouter = require("./src/router/AuthRouter");
const postRouter = require("./src/router/postRoutes");
const chatRouter = require("./src/router/ChatRouter");
const Post = require("./src/models/PostSchema");
const { authenticateToken } = require("./src/middleware/auth");
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Increase payload limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Try to connect to MongoDB Atlas
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dheerajkumarguthikonda161:WODhlo91SOTXNGsy@cluster0.qevxzyg.mongodb.net/";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully to:", MONGODB_URI);
    console.log("✅ Your existing posts should now be available!");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
    console.log("⚠️  Falling back to in-memory storage for development");
    console.log("⚠️  Your previous posts will not be available in this mode");
  });

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  try {
    res.json({ 
      status: "OK", 
      message: "Chat server is running",
      timestamp: new Date().toISOString(),
      users: global.users ? global.users.length : 0,
      messages: global.messages ? global.messages.length : 0,
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: "ERROR", message: "Health check failed" });
  }
});

// Basic routes (no auth required)
app.get("/", (req, res) => {
  res.send("Hello World! Chat server is running.");
});

// Auth routes (no auth required)
app.use("/api/auth", authRouter);

// Protected routes with authentication
app.use("/upload", authenticateToken, postRouter);
app.use("/api/chat", authenticateToken, chatRouter);

// Public post routes (no auth required for reading)
app.get("/posts", async (req, res) => {
  try {
    console.log('🔍 Fetching all posts');
    const posts = await Post.find().sort({ createdAt: -1 }).limit(100); // Limit to prevent overload
    console.log('📊 Total posts found:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('❌ Error fetching all posts:', error);
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
});

// Route for posts by single category
app.get("/posts/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    console.log('🔍 Searching for category:', category);

    const posts = await Post.find({
      $or: [
        { categories: { $regex: new RegExp(`^${category}$`, 'i') } },
        { category: { $regex: new RegExp(`^${category}$`, 'i') } }
      ]
    }).limit(50); // Limit to prevent overload

    console.log('📊 Found posts for category:', category, 'Count:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('❌ Error fetching posts by category:', error);
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
});

// Route for posts by multiple categories
app.get("/posts/categories", async (req, res) => {
  try {
    const categories = req.query.categories;
    console.log('🔍 Searching for categories:', categories);
    
    if (!categories) {
      return res.status(400).json({ message: "Categories parameter is required" });
    }
    
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    console.log('📋 Category array:', categoryArray);
    
    // Build regex array for case-insensitive matching
    const regexArray = categoryArray.map(cat => new RegExp(`^${cat}$`, 'i'));
    
    const posts = await Post.find({
      $or: [
        { categories: { $in: regexArray } },
        { category: { $in: regexArray } }
      ]
    }).limit(50); // Limit to prevent overload
    
    console.log('📊 Found posts for categories:', categoryArray, 'Count:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error('❌ Error fetching posts by categories:', error);
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
});

// Route for posts by single tag (for backward compatibility)
app.get("/posts/tags/:tag", async (req, res) => {
  try {
    const posts = await Post.find({ tags: req.params.tag }).limit(50); // Limit to prevent overload
    res.json(posts);
  } catch (error) {
    console.error('❌ Error fetching posts by tag:', error);
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
});

// Debug route to check all posts and their categories
app.get("/debug/posts", async (req, res) => {
  try {
    console.log('🔍 Debug: Fetching all posts to check structure');
    const posts = await Post.find({}).limit(20); // Limit for debug
    console.log('📊 Total posts in database:', posts.length);
    
    const postsWithCategories = posts.map(post => ({
      id: post._id,
      title: post.title,
      category: post.category,
      categories: post.categories,
      tags: post.tags,
      createdAt: post.createdAt
    }));
    
    console.log('📋 All posts structure:', postsWithCategories);
    res.json({
      totalPosts: posts.length,
      posts: postsWithCategories
    });
  } catch (error) {
    console.error('❌ Error in debug route:', error);
    res.status(500).json({ message: "Debug route error", error: error.message });
  }
});

// Create test users endpoint
app.post("/api/auth/create-test-users", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const testUsers = [
      { name: 'John Doe', email: 'john@test.com', password: 'password123' },
      { name: 'Jane Smith', email: 'jane@test.com', password: 'password123' },
      { name: 'Bob Wilson', email: 'bob@test.com', password: 'password123' },
      { name: 'Dheeraj Kumar', email: 'ui22ec21@iiitsurat.ac.in', password: 'password123' }
    ];

    for (const testUser of testUsers) {
      const existingUser = global.users.find(user => user.email === testUser.email);
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testUser.password, salt);
        
        const newUser = {
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: testUser.name,
          email: testUser.email,
          password: hashedPassword,
          isVerified: true,
          createdAt: new Date()
        };
        
        global.users.push(newUser);
      }
    }
    
    res.status(200).json({ 
      message: "Test users created successfully",
      users: global.users.map(u => ({ _id: u._id, name: u.name, email: u.email }))
    });
  } catch (error) {
    console.error('Create test users error:', error);
    res.status(500).json({ message: "Error creating test users", error: error.message });
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

console.log('Backend server started from', __filename);
console.log('Debug route /upload/debug/all-ids should be available if postRoutes.js is loaded.');

// Socket.io real-time chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room.`);
  });

  // Typing indicator for private chat
  socket.on('typing', ({ to }) => {
    socket.to(to).emit('typing', { from: socket.id });
  });

  // Private message
  socket.on('send_message', (data) => {
    try {
      io.to(data.receiver).emit('receive_message', data);
      
      // Find sender's name for notification
      let senderName = 'Someone';
      if (global.users) {
        const sender = global.users.find(user => user._id === data.sender);
        if (sender) {
          senderName = sender.name;
        }
      }
      
      // Notification for receiver with sender's name
      io.to(data.receiver).emit('notify', { 
        from: senderName, 
        type: 'private', 
        message: data 
      });
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Socket.io server is ready for real-time chat`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Frontend should be accessible at: http://localhost:3000`);
  console.log(`✅ Create test users: POST http://localhost:${PORT}/api/auth/create-test-users`);
});
