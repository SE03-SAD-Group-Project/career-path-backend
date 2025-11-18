const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema({
  careerName: String,
  skills: [String],
  interests: [String],
  workStyle: String
});

module.exports = mongoose.model("Career", careerSchema);
