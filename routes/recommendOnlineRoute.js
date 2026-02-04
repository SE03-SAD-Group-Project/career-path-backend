const express = require("express");
const router = express.Router();
const { recommendOnline } = require("../services/recommend_online");

router.post("/recommend-online", async (req, res) => {
  try {
    const { skills = [], interests = [], options = {} } = req.body;
    const userProfile = { skills, interests };
    const recs = await recommendOnline(userProfile, options);
    res.json({ ok: true, recommendations: recs });
  } catch (err) {
    console.error("Recommend Online Error:", err);
    res.status(500).json({ ok: false, error: "Internal error" });
  }
});

module.exports = router;
