const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet"); // OK to keep
// const mongoSanitize = require("express-mongo-sanitize");  // removed
const rateLimit = require("express-rate-limit");

dotenv.config();

// 🟢 MUST COME BEFORE ANY app.use()
const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cors());

// Rate limit (optional)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// Routes
const userRoutes = require("./routes/userRoutes");
const careerRoutes = require("./routes/careerRoutes");

app.use("/api/users", userRoutes);
app.use("/api/careers", careerRoutes);   // 🟢 MUST COME HERE (AFTER app = express())

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected yoooo"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
