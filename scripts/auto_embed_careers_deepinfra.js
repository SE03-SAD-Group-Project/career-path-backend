const mongoose = require('mongoose');
const Career = require('../models/career');
const { embedText } = require('../services/deepinfra_embeddings');
require('dotenv').config();

async function run(){
  await mongoose.connect(process.env.MONGO_URI);
  const items = await Career.find().lean();
  console.log("Found", items.length);
  for(const i of items){
    const text = `${i.title}. ${i.description}. ${(i.requiredSkills||[]).join(", ")}`;
    const emb = await embedText(text);
    if(emb) await Career.updateOne({ _id: i._id }, { $set: { embedding: emb }});
    console.log("Embedded", i.title);
  }
  console.log("All done"); process.exit(0);
}
run();
