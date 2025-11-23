const express = require("express");
const router = express.Router();

const Career = require("../models/career");
const { recommendCareers } = require("../services/career_recommendation");

// POST /api/recommend
router.post("/recommend", async (req, res) => {
  try {
    // defensive: ensure req.body is an object
    const safeBody = req.body || {};

    // helpful debug log — remove or lower in production
    console.log("Recommend route called. req.headers.content-type =", req.headers['content-type']);
    console.log("Recommend route body preview:", JSON.stringify(safeBody).slice(0, 1000));

    const { skills = [], interests = [], options = {} } = safeBody;

    const userProfile = { skills, interests };

    const careers = await Career.find().lean();

    const recommendations = recommendCareers(careers, userProfile, options);

    res.json({ ok: true, recommendations });
  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});


module.exports = router;
