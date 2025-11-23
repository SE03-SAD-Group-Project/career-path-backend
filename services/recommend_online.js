const Career = require("../models/career");
const { embedText } = require("./deepinfra_embeddings");

function cosine(a, b){
  if(!a || !b) return 0;
  let dot = 0, na=0, nb=0;
  for(let i=0;i<a.length;i++){ dot += (a[i]||0)*(b[i]||0); na += (a[i]||0)*(a[i]||0); nb += (b[i]||0)*(b[i]||0); }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) || 1);
}

async function recommendOnline(userProfile, options={ topN: 6 }){
  const { skills=[], interests=[] } = userProfile;
  // combine skills & interests text
  const userText = [
    skills.map(s => s.name || s).join(" "),
    (interests || []).join(" ")
  ].join(" ");
  const userEmb = await embedText(userText);
  if(!userEmb) return [];
  const careers = await Career.find().lean();
  const scored = careers.map(c => {
    const careerEmb = c.embedding || [];
    const sim = cosine(userEmb, careerEmb);
    return { title: c.title, description: c.description, score: sim, raw: c };
  }).sort((a,b)=>b.score - a.score);
  return scored.slice(0, options.topN || 6).map(s => ({ title: s.title, description: s.description, score: Number(s.score.toFixed(4)) }));
}

module.exports = { recommendOnline };
