// backend/server.js
console.log("✅ Using FIXED server.js");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

dotenv.config();

const app = express();

// Security & parsing
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // you can restrict this later
  })
);

// Rate limiting (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use(limiter);

// Simple health/home route
app.get("/", (req, res) => {
  res.send({ ok: true, message: "Career Path API Running" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API healthy" });
});

/* ------------ ROUTES (wired correctly) ------------ */

// users: register, login, saved, etc.
app.use("/api/users", require("./routes/userRoutes"));

// careers CRUD
app.use("/api/careers", require("./routes/careerRoutes"));

// career recommendation (used by frontend CareerForm.js)
// -> POST /api/careers/recommend
app.use("/api/careers", require("./routes/recommendRoute"));

// admin career management
// -> GET/POST/PUT/DELETE /api/admin/careers
app.use("/api/admin", require("./routes/adminRoutes"));

// online embedding-based recommendations
// -> POST /api/recommend-online
app.use("/api", require("./routes/recommendOnlineRoute"));

// quiz + suggestions
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/suggest", require("./routes/suggestRoutes"));

// simple AI helper route
app.use("/api/ai", require("./routes/aiChatRoute"));
// AI-based career recommendation
app.use("/api/ai", require("./routes/aiRecommendRoute"));

// AI-based resume analysis
app.use("/api/resume", require("./routes/resumeRoute"));


// ✅ AI-based growth tracker
app.use("/api/growth", require("./routes/growthRoute"));

// ✅ AI-based job description match
app.use("/api/jd", require("./routes/jdMatchRoute"));


/* ------------ DATABASE CONNECTION ------------ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
