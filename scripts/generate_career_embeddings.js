// backend/scripts/generate_career_embeddings.js
require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('../models/career');
const { embedText } = require('../services/career_embeddings');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const all = await Career.find().lean();
  console.log("Total careers:", all.length);

  for (const c of all) {
    const text = [c.title, c.description, (c.requiredSkills || []).join(", "), (c.relatedInterests || []).join(", ")].join(". ");
    try {
      const emb = await embedText(text);
      if (emb) {
        await Career.updateOne({ _id: c._id }, { $set: { embedding: emb } });
        console.log("Embedded:", c.title);
      } else {
        console.warn("No embedding for:", c.title);
      }
    } catch (e) {
      console.error("Error embedding:", c.title, e.message || e);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
