const express = require("express");
const router = express.Router();
const QuizResult = require("../models/quizResult");

// Save quiz result
router.post("/save", async (req, res) => {
  try {
    const { userId, scores, dominant } = req.body;

    const result = new QuizResult({
      userId,
      scores,
      dominant
    });

    await result.save();
    res.json({ message: "Quiz saved successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
