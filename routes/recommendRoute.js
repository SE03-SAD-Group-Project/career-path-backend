// backend/routes/recommendRoute.js
const express = require("express");
const router = express.Router();

const Career = require("../models/career");
const { recommendCareers } = require("../services/career_recommendation");

// Mounted at /api/careers in server.js
// POST /api/careers/recommend
router.post("/recommend", async (req, res) => {
  try {
    const safeBody = req.body || {};
    const rawSkills = Array.isArray(safeBody.skills) ? safeBody.skills : [];
    const rawInterests = Array.isArray(safeBody.interests) ? safeBody.interests : [];
    const workStyle = safeBody.workStyle || null;

    const userProfile = {
      skills: rawSkills,
      interests: rawInterests,
      workStyle,
    };

    // you can allow options in future: const options = safeBody.options || {};
    const options = {};

    const careers = await Career.find().lean();
    const recommendations = recommendCareers(careers, userProfile, options);

    const top = recommendations && recommendations.length > 0 ? recommendations[0] : null;

    return res.json({
      ok: true,
      recommendedCareer: top,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;
