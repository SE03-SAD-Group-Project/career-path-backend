const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Saved = require("../models/saved");

// REGISTER (simple)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const newUser = new User({ name, email, password });
    await newUser.save();
    return res.status(201).json({ message: "User registered", user: { id: newUser._id, name: newUser.name, email: newUser.email } });
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
    return res.status(200).json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// SAVE recommendation (anonymous or user)
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

// Get saved for user
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
