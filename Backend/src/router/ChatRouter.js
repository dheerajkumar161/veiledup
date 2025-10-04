const express = require('express');
const chatRouter = express.Router();
const upload = require('../middleware/upload');
const Message = require('../models/MessageSchema');
const leoProfanity = require('leo-profanity');

// Helper function to check database connection
const checkDbConnection = () => {
  return Message.db.readyState === 1;
};

// Send a message
chatRouter.post('/send', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { sender, receiver, content } = req.body;
    
    // Input validation
    if (!sender || !receiver) {
      return res.status(400).json({ message: "Sender and receiver are required" });
    }

    if (content && leoProfanity.check(content)) {
      return res.status(400).json({ message: 'Sensitive content and bad words are prohibited here.' });
    }
    
    const message = await Message.create({ sender, receiver, content });
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Get all messages for a user
chatRouter.get('/:userId', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userMessages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      deletedFor: { $ne: userId }
    }).populate('sender', 'name').populate('receiver', 'name').sort({ createdAt: 1 }).limit(100);
    
    res.json(userMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Get messages between two users
chatRouter.get('/between/:user1/:user2', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { user1, user2 } = req.params;
    if (!user1 || !user2) {
      return res.status(400).json({ message: "Both user IDs are required" });
    }

    const chatMessages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ],
      deletedFor: { $ne: user1 }
    }).populate('sender', 'name').populate('receiver', 'name').sort({ createdAt: 1 }).limit(100);
    
    res.json(chatMessages);
  } catch (error) {
    console.error('Get between messages error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Send an image message
chatRouter.post('/send-image', upload.single('image'), async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { sender, receiver, caption } = req.body;
    
    if (!sender || !receiver) {
      return res.status(400).json({ message: "Sender and receiver are required" });
    }

    if (caption && leoProfanity.check(caption)) {
      return res.status(400).json({ message: 'Sensitive content and bad words are prohibited here.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    const message = await Message.create({ sender, receiver, image: imagePath, content: caption });
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');
    res.status(201).json(message);
  } catch (error) {
    console.error('Send image error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: 'Failed to send image message', error: error.message });
  }
});

// Delete message for myself
chatRouter.post('/delete-for-me/:messageId', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { userId } = req.body;
    const { messageId } = req.params;
    
    if (!userId || !messageId) {
      return res.status(400).json({ message: "User ID and message ID are required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete for me error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid message ID format" });
    }
    res.status(500).json({ message: 'Failed to delete message for user', error: error.message });
  }
});

// Get all users for chat (simplified)
chatRouter.get('/users', async (req, res) => {
  try {
    const users = global.users || [];
    const userList = users.map(user => ({
      _id: user._id,
      name: user.name
      // Email removed for privacy
    }));
    res.json(userList);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Permanently delete a message for everyone
chatRouter.delete('/:messageId', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { userId } = req.query;
    const { messageId } = req.params;
    
    if (!userId || !messageId) {
      return res.status(400).json({ message: "User ID and message ID are required" });
    }

    console.log('Delete for everyone called with messageId:', messageId, 'userId:', userId);
    const message = await Message.findById(messageId);
    if (!message) {
      console.log('Message not found for delete:', messageId);
      return res.status(404).json({ message: 'Message not found' });
    }
    
    console.log('Sender:', message.sender.toString(), 'User:', userId.toString());
    if (message.sender.toString() !== userId.toString()) {
      console.log('Sender mismatch, not deleting.');
      return res.status(403).json({ message: 'Only the sender can delete this message for everyone.' });
    }
    
    const deleteResult = await Message.findByIdAndDelete(messageId);
    console.log('Delete result:', deleteResult);
    const stillExists = await Message.findById(messageId);
    console.log('After delete, still exists:', stillExists);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete for everyone error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid message ID format" });
    }
    res.status(500).json({ message: 'Failed to delete message for everyone', error: error.message });
  }
});

module.exports = chatRouter; 