// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Loads environment variables from .env file

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors());            // Allows frontend (React) to talk to backend
app.use(express.json());    // Parses incoming JSON data from requests
// Import user routes
const userRoutes = require("./routes/userRoutes");

// Use them
app.use("/api/users", userRoutes);

// --- Test Route (check if server runs) ---
app.get("/", (req, res) => {
  res.send("Career Path Backend Running Successfully 🚀");
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
