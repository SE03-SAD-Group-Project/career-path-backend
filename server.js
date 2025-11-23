console.log("USING THIS SERVER.JS FILE 111111");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// Home route
app.get("/", (req, res) => {
  res.send({ ok: true, message: "Career Path API Running" });
});

// Working routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/careers", require("./routes/careerRoutes"));
app.use("/api", require("./routes/recommendOnlineRoute.js"));

// ❌ REMOVE ALL NON-EXISTING ROUTES
 app.use("/api", require("./routes/recommendRoute"));
 //app.use("/api/post", require("./routes/postRoutes"));
 app.use("/api", require("./routes/suggestRoutes"));
 app.use("/api/admin", require("./routes/adminRoutes"));

// Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected yoooo"))
  .catch((err) => console.error("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
