const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRouter = express.Router();

// Try to import User model for MongoDB
let User;
try {
  User = require("../models/UserSchema");
} catch (error) {
  User = null;
  console.log("User model not available, using in-memory storage");
}

// Email validation function
const validateEmail = (email, stressTest = false) => {
  if (stressTest || email.includes('stresstest') || email.includes('loadtest')) return true;
  return email.endsWith('@iiitsurat.ac.in') || email.endsWith('@gmail.com') || email.endsWith('@test.com');
};

// Initialize global users array if not exists
if (!global.users) {
  global.users = [];
}

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Register endpoint
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists (case-insensitive email check)
    const existingUser = global.users.find(user => 
      user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: true, // Auto-verify for simplicity
      createdAt: new Date()
    };

    global.users.push(newUser);

    // Generate JWT token
    const token = generateToken(newUser);

    // Return user data (without password) and token
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt
    };

    console.log(`✅ User registered: ${newUser.email}`);
    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// Login endpoint
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email (case-insensitive)
    const user = global.users.find(user => 
      user.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (without password) and token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    console.log(`✅ User logged in: ${user.email}`);
    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Verify token endpoint
authRouter.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = global.users.find(u => u._id === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      message: "Token is valid",
      user: userResponse
    });

  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Token verification failed", error: error.message });
  }
});

// Get user profile endpoint
authRouter.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = global.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      message: "User profile retrieved successfully",
      user: userResponse
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: "Failed to get user profile", error: error.message });
  }
});

// Update user profile endpoint
authRouter.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userIndex = global.users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = global.users[userIndex];

    // Update fields if provided
    if (name && name.length >= 2) {
      user.name = name;
    }

    if (email && isValidEmail(email)) {
      // Check if email is already taken by another user
      const emailExists = global.users.some(u => 
        u._id !== userId && u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExists) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      
      user.email = email.toLowerCase();
    }

    // Update the user in the array
    global.users[userIndex] = user;

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    console.log(`✅ User profile updated: ${user.email}`);
    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// Get all users endpoint (for chat functionality)
authRouter.get("/users", async (req, res) => {
  try {
    const users = global.users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      message: "Users retrieved successfully",
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: "Failed to get users", error: error.message });
  }
});

// Health check for auth service
authRouter.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      message: "Auth service is healthy",
      totalUsers: global.users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth health check error:', error);
    res.status(500).json({ message: "Auth service health check failed", error: error.message });
  }
});

module.exports = authRouter;
