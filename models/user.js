const mongoose = require("mongoose");

// Define the user schema (the structure of user data)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // must be filled
    trim: true, // removes extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true, // no duplicate emails
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // password must be at least 6 characters
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model based on the schema
const User = mongoose.model("User", userSchema);

// Export it so other files can use it
module.exports = User;
