const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");

// Import Models
const User = require("../models/user");
const Saved = require("../models/saved");
const Request = require("../models/request"); 

// --- CONFIGURATION ---
const upload = multer({ storage: multer.memoryStorage() });
const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY || "dummy-key", 
  baseURL: "https://api.x.ai/v1", 
  dangerouslyAllowBrowser: true
});

// ... (Keep Register/Login Routes as they are) ...
// (I will paste the FULL file below so you don't miss anything)

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });
    const newUser = new User({ name, email, password, role: role || 'user' });
    await newUser.save();
    res.status(201).json({ message: "Registered", user: { id: newUser._id, name: newUser.name, role: newUser.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(400).json({ message: "Invalid credentials" });
    res.json({ message: "Login success", user: { id: user._id, name: user.name, email: user.email, role: user.role, seekingRole: user.seekingRole } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🧠 AI & RESUME ROUTES (The "Smart" Feature)
// ==========================================

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // 1. Extract Text
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.toLowerCase();
    
    // Debug: See what the code sees
    console.log("--- PDF TEXT ---");
    console.log(text.substring(0, 300) + "..."); 

    let aiRole = "General Applicant";

    if (process.env.XAI_API_KEY) {
       const completion = await client.chat.completions.create({
         model: "grok-beta",
         messages: [{ role: "system", content: "You are an HR expert. Return ONLY the job title." }, { role: "user", content: pdfData.text }]
       });
       aiRole = completion.choices[0].message.content.trim();
    } else {
       // ⚠️ FIXED MOCK LOGIC ⚠️

       // --- CULINARY / CHEF (New!) ---
       if (text.includes("chef") || text.includes("culinary") || text.includes("kitchen") || text.includes("cooking") || text.includes("sous") || text.includes("food safety")) {
          aiRole = "Chef / Culinary Expert";
       }
       // --- IT / TECH ---
       // Fix: Removed generic "mobile" to prevent phone number matches
       else if (text.includes("react") || text.includes("angular") || text.includes("frontend") || text.includes("ui/ux")) aiRole = "UI Engineer";
       else if (text.includes("python") || text.includes("data science") || text.includes("machine learning")) aiRole = "Data Scientist";
       else if (text.includes("java") || text.includes("node") || text.includes("backend") || text.includes("sql")) aiRole = "Backend Engineer";
       else if (text.includes("flutter") || text.includes("swift") || text.includes("android studio") || text.includes("ios app")) aiRole = "Mobile Developer";
       
       // --- BUSINESS ---
       else if (text.includes("marketing") || text.includes("seo") || text.includes("brand")) aiRole = "Marketing Specialist";
       else if (text.includes("accounting") || text.includes("finance") || text.includes("audit")) aiRole = "Accountant";
       else if (text.includes("project management") || text.includes("agile") || text.includes("scrum")) aiRole = "Project Manager";

       // --- ENGINEERING ---
       else if (text.includes("civil") || text.includes("construction") || text.includes("autocad")) aiRole = "Civil Engineer";
       else if (text.includes("mechanical") || text.includes("solidworks")) aiRole = "Mechanical Engineer";

       // --- OTHER ---
       else if (text.includes("teaching") || text.includes("education")) aiRole = "Teacher";
       else if (text.includes("nursing") || text.includes("medical") || text.includes("patient")) aiRole = "Healthcare Professional";
    }

    // 3. Save
    await User.findByIdAndUpdate(userId, { resumeText: pdfData.text, seekingRole: aiRole });
    console.log(`✅ Assigned: ${aiRole}`);
    res.json({ ok: true, role: aiRole, message: "Resume parsed successfully!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ... (Keep Recruitment, Admin, Saved Routes exactly the same) ...
// 1. GET CANDIDATES
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await User.find({ role: { $nin: ['employer', 'admin'] } }).select('-password');
    res.json({ ok: true, candidates });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 2. REQUEST CONNECTION
router.post("/request-connection", async (req, res) => {
  try {
    const { employerId, employeeId } = req.body;
    const existing = await Request.findOne({ employerId, employeeId });
    if(existing) return res.status(400).json({ message: "Request pending" });
    await Request.create({ employerId, employeeId, status: 'PENDING_ADMIN' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. MY REQUESTS
router.get("/my-requests", async (req, res) => {
  try {
    const requests = await Request.find({ employeeId: req.query.userId }).populate('employerId', 'name email');
    res.json({ ok: true, requests });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. UPDATE REQUEST
router.put("/requests/:id", async (req, res) => {
  try {
    await Request.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. ADMIN PENDING
router.get("/admin/pending-requests", async (req, res) => {
  try {
    const requests = await Request.find({ status: 'PENDING_ADMIN' }).populate('employerId').populate('employeeId');
    res.json({ ok: true, requests });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. SAVED ITEMS
router.post('/save-recommendation', async (req,res)=>{
  try {
    const { userId = "anonymous", careerTitle, score } = req.body;
    if(userId === "anonymous"){
      await Saved.create({ careerTitle, score, userId: "anonymous", createdAt: new Date()});
      return res.json({ ok:true });
    }
    const u = await User.findById(userId);
    if(u) { u.saved.push({ careerTitle, score, date: new Date() }); await u.save(); }
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

router.get('/saved', async (req,res)=>{ 
  const userId = req.query.userId || "anonymous";
  if(userId === "anonymous"){ const list = await Saved.find({ userId: "anonymous" }).lean(); return res.json({ ok:true, saved: list }); }
  const user = await User.findById(userId).lean();
  res.json({ ok:true, saved: user?.saved||[] });
});

// 7. JOB MATCH
router.post("/match-job", async (req, res) => {
  try {
    const { userId, jobDescription } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.resumeText) return res.status(400).json({ ok: false, message: "Upload resume first!" });

    let feedback = { score: 0, advice: "Analysis failed" };
    
    // MOCK MATCH LOGIC
    const resumeWords = new Set(user.resumeText.toLowerCase().split(/\W+/));
    const jdWords = jobDescription.toLowerCase().split(/\W+/);
    let matchCount = 0;
    // Expanded keywords for Chef compatibility
    const keywords = ["chef", "cooking", "food", "kitchen", "hygiene", "menu", "react", "python", "java", "sql", "communication"];
    const missing = [];

    keywords.forEach(word => {
      if (jdWords.includes(word)) {
        if (resumeWords.has(word)) matchCount += 10;
        else missing.push(word);
      }
    });

    let score = Math.min(95, Math.max(30, 30 + matchCount));
    feedback = { score, missingSkills: missing.slice(0, 3), advice: missing.length ? `Add: ${missing.join(", ")}` : "Good match!" };
    
    res.json({ ok: true, result: feedback });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;