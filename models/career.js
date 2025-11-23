const mongoose = require("mongoose");
const careerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  requiredSkills: { type: [String], default: [] },
  relatedInterests: { type: [String], default: [] },
  embedding: { type: [Number], default: [] } // store vector
}, { strict: true, timestamps: true });
module.exports = mongoose.model("Career", careerSchema);
