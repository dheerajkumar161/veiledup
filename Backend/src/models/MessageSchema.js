const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
  },
  content: {
    type: String,
    required: false,
  },
  image: {
    type: String, // URL or path to the uploaded image
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
});

module.exports = mongoose.model('Message', messageSchema); 