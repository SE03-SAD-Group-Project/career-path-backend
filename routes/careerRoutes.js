const express = require("express");
const router = express.Router();
const Career = require("../models/career");

// GET all careers
router.get("/", async (req, res) => {
  try {
    const rows = await Career.find().lean();
    res.json({ ok: true, careers: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// CREATE career
router.post("/", async (req, res) => {
  try {
    const c = await Career.create(req.body);
    res.json({ ok: true, career: c });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// UPDATE career
router.put("/:id", async (req, res) => {
  try {
    await Career.updateOne({ _id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE career
router.delete("/:id", async (req, res) => {
  try {
    await Career.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
