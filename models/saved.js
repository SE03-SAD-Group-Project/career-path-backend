const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
  userId: String,
  careerTitle: String,
  score: Number,
  createdAt: Date
});
module.exports = mongoose.model('Saved', Schema);
