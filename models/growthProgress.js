// backend/models/growthProgress.js
const mongoose = require("mongoose");

const growthProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    progress: {
      academic: { type: Number, default: 0 },
      industry: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      certifications: { type: Number, default: 0 },
      networking: { type: Number, default: 0 },
    },

    todos: { type: [String], default: [] },

    lastLog: { type: String, default: "" },
    lastExplanation: { type: String, default: "" },

    history: [
      {
        logText: String,
        progress: {
          academic: Number,
          industry: Number,
          skills: Number,
          certifications: Number,
          networking: Number,
        },
        todos: [String],
        explanation: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GrowthProgress", growthProgressSchema);
