const express = require("express");
const router = express.Router();
const User = require("../models/user");

// --- Test route ---
router.get("/", (req, res) => {
  res.send("User routes working ✅");
});

// --- Register new user ---
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// --- Get all users (for testing) ---
router.get("/all", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

module.exports = router;
// --- Login user ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if both fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password (simple version)
    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Success
    res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});
