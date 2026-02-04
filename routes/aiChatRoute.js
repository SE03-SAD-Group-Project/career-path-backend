const express = require('express');
const router = express.Router();
const axios = require('axios');
const { embedText } = require('../services/deepinfra_embeddings');

router.post('/chat', async (req,res)=>{
  try {
    const { message } = req.body;
    if(!message) return res.status(400).json({ ok:false, error:"No message" });
    // simple pattern: create a prompt using message and return a canned response (or call a text-gen if you add API)
    // For now return helpful guidance using skill matching
    const emb = await embedText(message);
    if(!emb) return res.json({ ok:false, reply: "Sorry, AI not available." });
    // Very simple heuristic reply
    return res.json({ ok:true, reply: `I can help with: job matching, skill plan, and courses. You asked: "${message}"` });
  } catch(e){ console.error(e); res.status(500).json({ ok:false, error: e.message }); }
});

module.exports = router;
