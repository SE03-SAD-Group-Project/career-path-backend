// backend/routes/aiRecommendRoute.js
const express = require("express");
const router = express.Router();

const Career = require("../models/career");
const { generateCareerRecommendation } = require("../services/ai_recommendation");

// POST /api/ai/recommend
router.post("/recommend", async (req, res) => {
  try {
    const { skills = [], interests = [], workStyle = "" } = req.body;

    // Load careers from database
    const careers = await Career.find().lean();

    // Call Groq Llama 3.1 AI
    const aiResult = await generateCareerRecommendation(
      { skills, interests, workStyle },
      careers
    );

    return res.json({ ok: true, aiResult });
  } catch (err) {
    console.error("AI Recommendation Error:", err);
    return res.status(500).json({ ok: false, error: "AI error occurred" });
  }
});

module.exports = router;
