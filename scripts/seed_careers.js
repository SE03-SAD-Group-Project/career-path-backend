// simple seed script - paste your careers array here
const mongoose = require('mongoose');
const Career = require('../models/career');
require('dotenv').config();

const careers = [
  { title: "Backend Developer", description: "Build APIs and servers", requiredSkills:["node.js","express","mongodb"], relatedInterests:["backend","databases"] },
  { title: "Frontend Developer", description: "UI & UX", requiredSkills:["react","css","javascript"], relatedInterests:["frontend","design"] },
  // add more careers...
];

async function run(){
  await mongoose.connect(process.env.MONGO_URI);
  for(const c of careers){
    await Career.updateOne({ title: c.title }, { $set: c }, { upsert: true });
    console.log("Upserted:", c.title);
  }
  console.log("Done");
  process.exit(0);
}
run();
