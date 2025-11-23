const express = require('express');
const router = express.Router();
const Career = require('../models/career');
const { embedText } = require('../services/deepinfra_embeddings');

// GET all careers
router.get('/careers', async (req, res) => {
  const list = await Career.find().lean();
  res.json({ ok: true, careers: list });
});

// CREATE career
router.post('/careers', async (req, res) => {
  try {
    const career = await Career.create(req.body);
    const text = `${career.title}. ${career.description}. ${career.requiredSkills.join(", ")}`;
    const emb = await embedText(text);
    if (emb) await Career.updateOne({ _id: career._id }, { $set: { embedding: emb } });
    res.json({ ok: true, career });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// UPDATE
router.put('/careers/:id', async (req, res) => {
  try {
    await Career.updateOne({ _id: req.params.id }, { $set: req.body });
    const c = await Career.findById(req.params.id).lean();
    const text = `${c.title}. ${c.description}. ${c.requiredSkills.join(", ")}`;
    const emb = await embedText(text);
    if (emb) await Career.updateOne({ _id: c._id }, { $set: { embedding: emb } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE
router.delete('/careers/:id', async (req, res) => {
  try {
    await Career.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
