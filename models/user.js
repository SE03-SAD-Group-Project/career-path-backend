const mongoose = require("mongoose");
const Schema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // currently plain; can switch to bcrypt later
  saved: [{ careerTitle: String, score: Number, date: Date }]
}, { timestamps: true });
module.exports = mongoose.model("User", Schema);
