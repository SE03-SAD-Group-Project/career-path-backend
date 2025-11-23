// backend/scripts/seed_careers.js
require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('../models/career'); // adjust path if needed

const careers = [
  { title: "Backend Developer", description:"Build server-side APIs", requiredSkills:["node.js","express","javascript","mongodb","rest api"], relatedInterests:["backend","databases"] },
  { title: "Frontend Developer", description:"UI & client apps", requiredSkills:["html","css","javascript","react","tailwind"], relatedInterests:["ui","ux","design"] },
  { title: "Full Stack Developer", description:"Frontend+Backend", requiredSkills:["javascript","react","node.js","mongodb","express"], relatedInterests:["system design","frontend","backend"] },
  { title: "Mobile App Developer", description:"iOS/Android apps", requiredSkills:["flutter","dart","react native","java","kotlin"], relatedInterests:["mobile","ui"] },
  { title: "Data Scientist", description:"Data analysis & ML", requiredSkills:["python","pandas","numpy","scikit-learn","statistics"], relatedInterests:["ai","ml","research"] },
  { title: "Machine Learning Engineer", description:"Production ML systems", requiredSkills:["python","tensorflow","pytorch","mlops","statistics"], relatedInterests:["ml","ai"] },
  { title: "DevOps Engineer", description:"CI/CD, infra as code", requiredSkills:["docker","kubernetes","terraform","ansible","ci/cd"], relatedInterests:["automation","cloud","sre"] },
  { title: "Cloud Engineer", description:"Design cloud infra", requiredSkills:["aws","azure","gcp","terraform","docker"], relatedInterests:["cloud","infrastructure"] },
  { title: "Site Reliability Engineer", description:"Reliability & monitoring", requiredSkills:["prometheus","grafana","kubernetes","sre","linux"], relatedInterests:["sre","monitoring"] },
  { title: "Database Administrator", description:"DB maintenance & tuning", requiredSkills:["sql","postgres","mysql","mongodb","backup"], relatedInterests:["databases","performance"] },
  { title: "Security Engineer", description:"Protect systems & infra", requiredSkills:["penetration testing","firewalls","networking","kali linux"], relatedInterests:["security","networking"] },
  { title: "Network Engineer", description:"Routing/switching", requiredSkills:["routing","switching","ccna","tcp/ip","subnetting"], relatedInterests:["networking","infrastructure"] },
  { title: "QA Engineer", description:"Testing & automation", requiredSkills:["selenium","jest","cypress","automation","manual testing"], relatedInterests:["quality","automation"] },
  { title: "Product Manager", description:"Lead product strategy", requiredSkills:["roadmap","stakeholder","strategy","analytics"], relatedInterests:["product","business"] },
  { title: "UX/UI Designer", description:"Design user experiences", requiredSkills:["figma","adobe xd","ux research","ui design"], relatedInterests:["design","ux"] },
  { title: "Business Analyst", description:"Data-driven business decisions", requiredSkills:["sql","excel","analytics","powerbi"], relatedInterests:["business","data"] },
  { title: "Systems Architect", description:"High-level system designs", requiredSkills:["system design","scalability","architecture","microservices"], relatedInterests:["architecture","design"] },
  { title: "Robotics Engineer", description:"Robot design & control", requiredSkills:["c++","ros","control systems","mechanical"], relatedInterests:["robotics","automation"] },
  { title: "Game Developer", description:"Games & engines", requiredSkills:["unity","c#","unreal","c++","graphics"], relatedInterests:["games","graphics"] },
  { title: "Blockchain Developer", description:"Smart contracts & dapps", requiredSkills:["solidity","web3","ethereum","smart contracts"], relatedInterests:["blockchain","crypto"] },
  { title: "AI Researcher", description:"ML research & papers", requiredSkills:["python","research","math","pytorch"], relatedInterests:["research","ml"] },
  { title: "Computer Vision Engineer", description:"Image/video ML", requiredSkills:["opencv","python","pytorch","cnn"], relatedInterests:["vision","ml"] },
  { title: "NLP Engineer", description:"Language models & NLP", requiredSkills:["nlp","transformers","python","pytorch"], relatedInterests:["nlp","ai"] },
  { title: "Embedded Systems Engineer", description:"Firmware & hardware", requiredSkills:["c","embedded","microcontrollers","rtos"], relatedInterests:["hardware","embedded"] },
  { title: "IOT Engineer", description:"IoT solutions", requiredSkills:["mqtt","raspberry pi","sensors","embedded"], relatedInterests:["iot","sensors"] },
  { title: "Technical Support Engineer", description:"Help customers", requiredSkills:["troubleshooting","linux","customer support"], relatedInterests:["support","ops"] },
  { title: "Data Engineer", description:"Data pipelines & ETL", requiredSkills:["spark","airflow","sql","python"], relatedInterests:["data","etl"] },
  { title: "QA Automation Engineer", description:"Automate tests", requiredSkills:["selenium","webdriver","automation","ci/cd"], relatedInterests:["qa","automation"] },
  { title: "Performance Engineer", description:"Performance & profiling", requiredSkills:["profiling","benchmarking","optimization"], relatedInterests:["performance","systems"] },
  { title: "Cloud Security Engineer", description:"Cloud security", requiredSkills:["iam","cloud security","aws security"], relatedInterests:["security","cloud"] },
  { title: "BI Developer", description:"Dashboards & reporting", requiredSkills:["powerbi","tableau","sql","etl"], relatedInterests:["analytics","bi"] },
  { title: "Mobile Game Developer", description:"Mobile games", requiredSkills:["unity","c#","mobile optimization"], relatedInterests:["games","mobile"] },
  { title: "XR Developer", description:"AR/VR apps", requiredSkills:["unity","xr","3d graphics"], relatedInterests:["xr","vr"] },
  { title: "Dev Tools Engineer", description:"Developer productivity tools", requiredSkills:["typescript","node","tooling","sdk"], relatedInterests:["devtools","productivity"] },
  { title: "Site Performance Engineer", description:"Frontend perf", requiredSkills:["webperf","lighthouse","profiling","js"], relatedInterests:["performance","frontend"] },
  { title: "SEO Specialist", description:"Search optimization", requiredSkills:["seo","analytics","content"], relatedInterests:["marketing","seo"] },
  { title: "IT Manager", description:"Manage IT teams", requiredSkills:["leadership","infrastructure","procurement"], relatedInterests:["management","ops"] },
  { title: "Cloud Architect", description:"Cloud system design", requiredSkills:["aws","azure","gcp","architecture"], relatedInterests:["cloud","architecture"] },
  { title: "Systems Administrator", description:"Server administration", requiredSkills:["linux","bash","monitoring","ansible"], relatedInterests:["ops","systems"] },
  { title: "CTO (Startup)", description:"Tech leadership in startups", requiredSkills:["leadership","architecture","product","scaling"], relatedInterests:["leadership","strategy"] },
  { title: "Hardware Engineer", description:"Design PCBs & electronics", requiredSkills:["pcb","electronics","altium","analog"], relatedInterests:["hardware","electronics"] },
  { title: "Data Privacy Officer", description:"Privacy & compliance", requiredSkills:["gdpr","privacy","legal"], relatedInterests:["compliance","privacy"] },
  { title: "Analytics Engineer", description:"Modeling & dbt", requiredSkills:["dbt","sql","modelling","analytics"], relatedInterests:["analytics","data"] },
  { title: "Localization Engineer", description:"i18n & localization", requiredSkills:["i18n","l10n","automation"], relatedInterests:["localization","engineering"] },
  { title: "Customer Success Engineer", description:"Onboarding & success", requiredSkills:["customer success","integration","api"], relatedInterests:["customer","success"] }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  for (const c of careers) {
    try {
      // upsert by title
      await Career.updateOne({ title: c.title }, { $set: c }, { upsert: true });
      console.log("Upserted:", c.title);
    } catch (e) {
      console.error("Err:", c.title, e.message);
    }
  }
  console.log("Done");
  process.exit(0);
}

run().catch(e=>{console.error(e); process.exit(1)});
