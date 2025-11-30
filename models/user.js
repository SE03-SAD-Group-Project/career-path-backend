const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // currently plain; can switch to bcrypt later
  role: { type: String, default: "user" },    // ⭐ ADD THIS LINE
  saved: [{ careerTitle: String, score: Number, date: Date }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
