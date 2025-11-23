// backend/services/recommend_online.js
const Career = require("../models/career");
const { embedText } = require("./deepinfra_embeddings");
const cache = require("./cache");

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function careerToText(c) {
  return `${c.title}. ${c.description}. ${Array.isArray(c.requiredSkills) ? c.requiredSkills.join(", ") : ""}. ${Array.isArray(c.relatedInterests) ? c.relatedInterests.join(", ") : ""}`;
}

async function recommendOnline(userProfile, options = {}) {
  const { topN = 5, forceRefresh = false } = options;

  // Build user text
  const userText = [
    ...(userProfile.skills || []).map(s => (s.name || s).toString()),
    ...(userProfile.interests || [])
  ].join(", ").trim();

  // Compute cache key for user query (basic)
  const requestKey = `rec:${userText.toLowerCase().slice(0,400)}:n${topN}`;

  if (!forceRefresh) {
    const cached = cache.get(requestKey);
    if (cached) return cached;
  }

  // user embedding (cached inside embedText)
  const userEmbedding = await embedText(userText || " ");
  if (!userEmbedding) return [];

  const careers = await Career.find().lean();
  const scored = [];

  for (const c of careers) {
    // try using stored embedding in DB if present
    let emb = Array.isArray(c.embedding) && c.embedding.length ? c.embedding : null;

    // if missing, check cache for career text
    const cText = careerToText(c);
    const cKey = `careerEmb:${(c._id || c.title).toString()}`;

    if (!emb) {
      emb = cache.get(cKey);
      if (!emb) {
        emb = await embedText(cText);
        if (emb) cache.set(cKey, emb, 60 * 60 * 24 * 30); // cache 30 days
      }
    }

    if (!emb) continue;
    const score = cosine(userEmbedding, emb);
    scored.push({
      title: c.title,
      description: c.description,
      score: Number(score.toFixed(6)),
      careerId: c._id
    });
  }

  scored.sort((a,b)=> b.score - a.score);
  const top = scored.slice(0, topN);
  // cache results for identical query for short time
  cache.set(requestKey, top, 60 * 5); // cache 5 minutes
  return top;
}

module.exports = { recommendOnline };
