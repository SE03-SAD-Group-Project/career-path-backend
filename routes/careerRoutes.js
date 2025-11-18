const express = require("express");
const router = express.Router();

// Temporary in-code career database
const careerDatabase = [
  {
    career: "Software Engineer",
    skills: ["programming", "problem solving", "logic"],
    interests: ["technology", "coding"],
    workStyle: "analytical"
  },
  {
    career: "Graphic Designer",
    skills: ["creativity", "design", "art"],
    interests: ["drawing", "visuals"],
    workStyle: "creative"
  },
  {
    career: "Business Analyst",
    skills: ["communication", "analysis", "documentation"],
    interests: ["business", "strategy"],
    workStyle: "analytical"
  },
  {
    career: "Nurse",
    skills: ["empathy", "caregiving"],
    interests: ["helping people"],
    workStyle: "social"
  }
];

// POST /recommend logic
router.post("/recommend", async (req, res) => {
  try {
    const { skills, interests, workStyle } = req.body;

    let bestCareer = null;
    let bestScore = 0;

    careerDatabase.forEach((career) => {
      let score = 0;

      // Skills match
      career.skills.forEach((s) => {
        if (skills.includes(s)) score += 2;
      });

      // Interests match
      career.interests.forEach((i) => {
        if (interests.includes(i)) score += 1;
      });

      // Work style match
      if (career.workStyle === workStyle) score += 3;

      // Save best career
      if (score > bestScore) {
        bestScore = score;
        bestCareer = career.career;
      }
    });

    return res.json({
      recommendedCareer: bestCareer || "No strong match found",
      score: bestScore
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error generating recommendation",
      error
    });
  }
});

module.exports = router;
