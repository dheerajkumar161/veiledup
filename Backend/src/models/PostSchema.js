const mongoose = require("mongoose");

// Comment schema with unlimited nesting support
const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: String }], // Array of user IDs who liked this comment
  replies: [this], // Self-referencing for unlimited nesting
}, { timestamps: true });

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      ref: "User",
      required: [true, "Author is required"],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      trim: true,
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    photo: {
      type: String,
      default: null, // Assuming the photo is stored as a URL or path to the image
    },
    comments: [commentSchema],
    likes: [{ type: String }],
    archived: { type: Boolean, default: false },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model("Post", postSchema);
