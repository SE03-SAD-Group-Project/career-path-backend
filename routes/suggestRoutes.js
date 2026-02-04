const express = require('express');
const router = express.Router();
const Career = require('../models/career');
const { embedText } = require('../services/deepinfra_embeddings');

router.get('/skills', async (req,res)=>{
  const q = (req.query.q||"").toLowerCase().trim();
  if(!q) return res.json({ok:true, suggestions:[]});

  const careers = await Career.find().lean();
  const pool = new Set();
  for(const c of careers) (c.requiredSkills||[]).forEach(s=>pool.add(s));

  const arr = Array.from(pool);
  const substringMatches = arr.filter(s=> s.toLowerCase().includes(q)).slice(0,10);
  if(substringMatches.length >= 6) return res.json({ ok:true, suggestions: substringMatches });

  try {
    const userEmb = await embedText(q);
    if(!userEmb) return res.json({ ok:true, suggestions: substringMatches });
    const scored = [];
    for(const s of arr){
      const se = await embedText(s);
      if(!se) continue;
      let dot=0, na=0, nb=0;
      for(let i=0;i<userEmb.length;i++){ dot += (userEmb[i]||0)*(se[i]||0); na += (userEmb[i]||0)*(userEmb[i]||0); nb += (se[i]||0)*(se[i]||0); }
      const cos = dot/(Math.sqrt(na)*Math.sqrt(nb)||1);
      scored.push({ s, cos });
    }
    scored.sort((a,b)=>b.cos-a.cos);
    return res.json({ ok:true, suggestions: scored.slice(0,10).map(x=>x.s) });
  } catch(e){
    console.error(e);
    return res.json({ ok:true, suggestions: substringMatches });
  }
});

module.exports = router;
