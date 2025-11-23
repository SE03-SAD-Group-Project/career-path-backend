const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  requiredSkills: { type: [String], default: [] },
  relatedInterests: { type: [String], default: [] },
  embedding: { type: [Number], default: [] }
}, { strict: true });

module.exports = mongoose.model("Career", careerSchema);
