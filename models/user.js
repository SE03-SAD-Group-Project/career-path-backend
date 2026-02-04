const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  saved: [{ careerTitle: String, score: Number, date: Date }],
  
  // ⭐ NEW AI FIELDS ⭐
  resumeText: { type: String },       // The raw text from the PDF
  seekingRole: { type: String }       // The AI's classification (e.g., "UI Engineer")
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);