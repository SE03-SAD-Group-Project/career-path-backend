// backend/scripts/auto_embed_careers_deepinfra.js
require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('../models/career');
const { embedText } = require('../services/deepinfra_embeddings'); // service from step1

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  const careers = await Career.find().lean();
  console.log("Found", careers.length);
  for (const c of careers) {
    const text = `${c.title}. ${c.description}. ${ (c.requiredSkills||[]).join(", ") }`;
    try {
      const emb = await embedText(text);
      if (emb && emb.length) {
        await Career.updateOne({ _id: c._id }, { $set: { embedding: emb } });
        console.log("Embedded", c.title);
      } else {
        console.warn("No embedding for", c.title);
      }
    } catch (e) {
      console.error("Error embedding", c.title, e.message || e);
    }
  }
  console.log("All done");
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
