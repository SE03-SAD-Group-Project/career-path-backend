const express = require('express');
const router = express.Router();
const Career = require('../models/career');
const { embedText } = require('../services/deepinfra_embeddings');

// GET all careers
router.get('/careers', async (req, res) => {
  try {
    const rows = await Career.find().lean();
    res.json({ ok: true, careers: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// CREATE career
router.post('/careers', async (req, res) => {
  try {
    const c = await Career.create(req.body);

    // Auto embed
    const text = `${c.title}. ${c.description}. ${(c.requiredSkills || []).join(", ")}`;
    const emb = await embedText(text);

    if (emb) {
      await Career.updateOne({ _id: c._id }, { $set: { embedding: emb } });
    }

    res.json({ ok: true, career: c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// UPDATE career
router.put('/careers/:id', async (req, res) => {
  try {
    await Career.updateOne({ _id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE career
router.delete('/careers/:id', async (req, res) => {
  try {
    await Career.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
