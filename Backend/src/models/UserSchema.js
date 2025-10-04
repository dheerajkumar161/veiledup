const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /\b[A-Za-z0-9._%+-]+@iiitsurat\.ac\.in\b/,
      "Please use a valid IIITSurat email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  bio: {
    type: String,
    trim: true,
  },
  branch: String,
  batch: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  blocked: {
    type: Boolean,
    default: false,
  },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
});

module.exports = mongoose.model("User", userSchema);
