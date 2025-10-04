const express = require("express");
const Post = require("../models/PostSchema");
const upload = require("../middleware/upload");
const postRouter = express.Router();
const leoProfanity = require('leo-profanity');

// Helper function to check database connection
const checkDbConnection = () => {
  return Post.db.readyState === 1;
};

// Create a new post
postRouter.post("/create", upload.single("photo"), async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    let { title, author, tags, emoji, category, categories } = req.body;
    
    // Input validation
    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    console.log('DEBUG: title value:', title, 'type:', typeof title);
    if (typeof title !== 'string') {
      title = String(title);
    }
    
    if (leoProfanity.check(title)) {
      return res.status(400).json({ message: "Sensitive content and bad words are prohibited here." });
    }
    
    // Handle categories - support both single category and multiple categories
    let postCategories = [];
    if (categories) {
      try {
        postCategories = JSON.parse(categories);
      } catch (e) {
        postCategories = [categories];
      }
    } else if (category) {
      postCategories = [category];
    }
    
    const newPost = new Post({
      title,
      author,
      tags: tags ? JSON.parse(tags) : [],
      emoji,
      category: category || (postCategories.length > 0 ? postCategories[0] : null),
      categories: postCategories,
      photo: req.file ? `uploads/${req.file.filename}` : undefined,
    });
    
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: "Failed to create the post", error: error.message });
  }
});

// Get all posts
postRouter.get("/posts", async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const posts = await Post.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
});

// Get posts by category
postRouter.get("/posts/category/:category", async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const category = req.params.category;
    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    const posts = await Post.find({ 
      category: { $regex: new RegExp(`^${category}$`, 'i') } 
    }).limit(50);
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    res.status(500).json({ message: "Failed to fetch posts by category", error: error.message });
  }
});

// Add a comment to a post
postRouter.post('/:id/comment', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    console.log('Comment route called with post ID:', req.params.id);
    const { author, text } = req.body;
    
    if (!author || !text) {
      return res.status(400).json({ message: "Author and text are required" });
    }

    if (leoProfanity.check(text)) {
      return res.status(400).json({ message: "Sensitive content and bad words are prohibited here." });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.error('Post not found for comment. ID:', req.params.id);
      return res.status(404).json({ message: 'Post not found for comment', id: req.params.id });
    }
    
    post.comments.push({ author, text });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Like or unlike a post
postRouter.post('/:id/like', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    console.log('Like route called with post ID:', req.params.id);
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.error('Post not found for like. ID:', req.params.id);
      return res.status(404).json({ message: 'Post not found for like', id: req.params.id });
    }
    
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Like post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    res.status(500).json({ message: 'Failed to update like', error: error.message });
  }
});

// Like or unlike a comment
postRouter.post('/:postId/comment/:commentId/like', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Find the comment by ID
    const findComment = (comments, commentId) => {
      for (let comment of comments) {
        if (comment._id.toString() === commentId) {
          return comment;
        }
        if (comment.replies && comment.replies.length > 0) {
          const found = findComment(comment.replies, commentId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const comment = findComment(post.comments, req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const index = comment.likes.indexOf(userId);
    if (index === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(index, 1);
    }
    
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Like comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post or comment ID format" });
    }
    res.status(500).json({ message: 'Failed to update comment like', error: error.message });
  }
});

// Add nested reply to any comment (unlimited levels)
postRouter.post('/:postId/comment/:commentId/reply', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { author, text } = req.body;
    if (!author || !text) {
      return res.status(400).json({ message: "Author and text are required" });
    }

    if (leoProfanity.check(text)) {
      return res.status(400).json({ message: "Sensitive content and bad words are prohibited here." });
    }
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Recursive function to find comment and add reply
    const addReplyToComment = (comments, commentId, reply) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === commentId) {
          if (!comments[i].replies) {
            comments[i].replies = [];
          }
          comments[i].replies.push(reply);
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (addReplyToComment(comments[i].replies, commentId, reply)) {
            return true;
          }
        }
      }
      return false;
    };
    
    const reply = { author, text };
    const success = addReplyToComment(post.comments, req.params.commentId, reply);
    
    if (!success) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Add reply error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post or comment ID format" });
    }
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
});

// Delete a comment
postRouter.delete('/:postId/comment/:commentId', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Recursive function to find and delete comment
    const deleteComment = (comments, commentId, userId) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === commentId) {
          // Check if user is the author of the comment
          if (comments[i].author !== userId) {
            return { success: false, message: 'You can only delete your own comments' };
          }
          comments.splice(i, 1);
          return { success: true };
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          const result = deleteComment(comments[i].replies, commentId, userId);
          if (result.success !== undefined) {
            return result;
          }
        }
      }
      return { success: false, message: 'Comment not found' };
    };
    
    const result = deleteComment(post.comments, req.params.commentId, userId);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    
    await post.save();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post or comment ID format" });
    }
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

// Get a single post by ID
postRouter.get('/:id', async (req, res) => {
  try {
    if (!checkDbConnection()) {
      return res.status(503).json({ message: "Database connection unavailable" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Get single post error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
});

module.exports = postRouter;
