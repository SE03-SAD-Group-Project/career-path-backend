const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Saved = require("../models/saved");
const Request = require("../models/request"); // Make sure you created this file!

// REGISTER (Updated with Role)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // Accept role from frontend
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    
    // Default to 'user' (employee) if no role provided
    const newUser = new User({ name, email, password, role: role || 'user' });
    await newUser.save();
    
    return res.status(201).json({ message: "User registered", user: { id: newUser._id, name: newUser.name, role: newUser.role } });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.password !== password) return res.status(400).json({ message: "Invalid password" });
    
    // Return role so frontend knows which dashboard to show
    return res.status(200).json({ 
      message: "Login successful", 
      token: "fake-jwt-token-" + user._id, // In real app, use real JWT
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// --- NEW RECRUITMENT ROUTES ---

// 1. GET ALL CANDIDATES (For Employers to browse)
router.get("/candidates", async (req, res) => {
  try {
    // Find all users who are NOT admins or employers
    const candidates = await User.find({ role: 'user' }).select('-password');
    res.json({ ok: true, candidates });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 2. CREATE CONNECTION REQUEST (Employer -> Admin)
router.post("/request-connection", async (req, res) => {
  try {
    const { employerId, employeeId } = req.body;
    
    // Check if request already exists
    const existing = await Request.findOne({ employerId, employeeId });
    if(existing) return res.status(400).json({ ok: false, message: "Request already pending or active" });

    await Request.create({ 
      employerId, 
      employeeId, 
      status: 'PENDING_ADMIN' // Starts here
    });

    res.json({ ok: true, message: "Request sent to Admin for approval" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 3. GET MY REQUESTS (For Employee Dashboard)
router.get("/my-requests", async (req, res) => {
  try {
    const { userId } = req.query; // Pass ?userId=... from frontend
    if(!userId) return res.status(400).json({ ok:false, error: "Missing userId" });

    const requests = await Request.find({ employeeId: userId })
      .populate('employerId', 'name email')
      .sort({ createdAt: -1 });
      
    res.json({ ok: true, requests });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 4. RESPOND TO REQUEST (Employee Accepts/Denies)
router.put("/requests/:id", async (req, res) => {
  try {
    const { status } = req.body; // 'ACCEPTED' or 'DENIED'
    await Request.findByIdAndUpdate(req.params.id, { status });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- EXISTING ROUTES ---

// SAVE recommendation
router.post('/save-recommendation', async (req,res)=>{
  try {
    const { userId = "anonymous", careerTitle, score } = req.body;
    if(userId === "anonymous"){
      await Saved.create({ careerTitle, score, userId: "anonymous", createdAt: new Date()});
      return res.json({ ok:true });
    }
    const u = await User.findById(userId);
    if(!u) return res.status(404).json({ ok:false, error:"User not found" });
    u.saved = u.saved || [];
    u.saved.push({ careerTitle, score, date: new Date() });
    await u.save();
    res.json({ ok:true });
  } catch(e){ console.error(e); res.status(500).json({ ok:false, error:e.message }); }
});

// Get saved
router.get('/saved', async (req,res)=>{
  const userId = req.query.userId || "anonymous";
  if(userId === "anonymous"){
    const list = await Saved.find({ userId: "anonymous" }).lean();
    return res.json({ ok:true, saved: list });
  }
  const user = await User.findById(userId).lean();
  res.json({ ok:true, saved: user?.saved||[] });
});

module.exports = router;