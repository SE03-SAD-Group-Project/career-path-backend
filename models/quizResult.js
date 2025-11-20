const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  scores: Object,
  dominant: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("QuizResult", quizSchema);
