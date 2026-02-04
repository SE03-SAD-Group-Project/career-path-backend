// backend/routes/growthRoute.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const GrowthProgress = require("../models/growthProgress");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function clampPct(n) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function ensureProgress(obj) {
  const p = obj || {};
  return {
    academic: clampPct(p.academic),
    industry: clampPct(p.industry),
    skills: clampPct(p.skills),
    certifications: clampPct(p.certifications),
    networking: clampPct(p.networking),
  };
}

function ensureTodos(arr) {
  return Array.isArray(arr) ? arr.filter(Boolean).map(String).slice(0, 12) : [];
}

function extractJson(text = "") {
  // Remove ```json fences
  const cleaned = text.replace(/```json|```/g, "").trim();

  // Try to cut out the first JSON object
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return cleaned.slice(first, last + 1);
  }
  return cleaned;
}

function defaultState() {
  return {
    progress: { academic: 0, industry: 0, skills: 0, certifications: 0, networking: 0 },
    todos: [
      "Log one learning activity you did today",
      "Add 1 new skill you want to improve this week",
      "Complete one small portfolio task (even 30 minutes)",
    ],
    explanation: "Start logging small wins daily — the AI will adjust your progress and tasks.",
  };
}

/**
 * GET /api/growth/state?userId=...
 * Returns saved state (creates default if none)
 */
router.get("/state", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    let doc = await GrowthProgress.findOne({ userId }).lean();
    if (!doc) {
      const seed = defaultState();
      const created = await GrowthProgress.create({
        userId,
        progress: seed.progress,
        todos: seed.todos,
        lastExplanation: seed.explanation,
      });
      doc = created.toObject();
    }

    return res.json({
      ok: true,
      progress: ensureProgress(doc.progress),
      todos: ensureTodos(doc.todos),
      explanation: doc.lastExplanation || "",
      lastLog: doc.lastLog || "",
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("Growth state error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * POST /api/growth/evaluate
 * Body: { userId, logText }
 */
router.post("/evaluate", async (req, res) => {
  try {
    const { userId, logText = "" } = req.body;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });
    if (!logText.trim()) return res.status(400).json({ ok: false, message: "logText is required" });

    // Load current state (or create default)
    let doc = await GrowthProgress.findOne({ userId });
    if (!doc) {
      const seed = defaultState();
      doc = await GrowthProgress.create({
        userId,
        progress: seed.progress,
        todos: seed.todos,
        lastExplanation: seed.explanation,
      });
    }

    const current = ensureProgress(doc.progress);

    const systemPrompt = `
You are an AI career growth coach.
Return ONLY valid JSON (no markdown, no comments, no extra text).
The user writes a progress log. Update the five progress categories (0-100).
Give practical todos and a concise explanation.
`;

    const userPrompt = `
User progress log:
"${logText}"

Current progress:
${JSON.stringify(current)}

Rules:
- Output JSON only
- Keep progress realistic: small changes for small actions
- Each progress field must be an integer 0-100
- todos: 5 to 8 items, short actionable tasks
- explanation: 2 to 5 sentences, friendly and specific to the log
Return this JSON shape exactly:
{
  "progress": { "academic": 0, "industry": 0, "skills": 0, "certifications": 0, "networking": 0 },
  "todos": ["..."],
  "explanation": "..."
}
`;

/**
 * GET /api/growth/history?userId=...&limit=7
 * Returns latest logs from history
 */
router.get("/history", async (req, res) => {
  try {
    const { userId, limit = 7 } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    const doc = await GrowthProgress.findOne({ userId }).lean();
    if (!doc) return res.json({ ok: true, history: [] });

    const n = Math.max(1, Math.min(30, parseInt(limit, 10) || 7));
    const history = Array.isArray(doc.history) ? doc.history.slice(0, n) : [];

    return res.json({ ok: true, history });
  } catch (err) {
    console.error("Growth history error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/**
 * GET /api/growth/streak?userId=...
 * Calculates daily streak from history timestamps
 */
router.get("/streak", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ ok: false, message: "userId is required" });

    const doc = await GrowthProgress.findOne({ userId }).lean();
    const history = Array.isArray(doc?.history) ? doc.history : [];

    // streak based on consecutive calendar days (local server time)
    const dayKey = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    };

    const days = [...new Set(history.map(h => dayKey(h.createdAt || h.createdAt === 0 ? h.createdAt : h.createdAt)).filter(Boolean))];

    // If no logs
    if (days.length === 0) return res.json({ ok: true, streak: 0 });

    // Sort days descending
    days.sort((a, b) => (a < b ? 1 : -1));

    // Walk backward from today
    const today = new Date();
    const todayKey = dayKey(today);

    // Accept streak starting either today or yesterday (if user hasn't logged today yet)
    const keys = new Set(days);
    let streak = 0;

    // helper: shift date by -k days
    const shiftKey = (base, k) => {
      const d = new Date(base);
      d.setDate(d.getDate() - k);
      return dayKey(d);
    };

    // Start from today; if no today entry, start from yesterday
    let startOffset = keys.has(todayKey) ? 0 : 1;

    for (let i = startOffset; i < 365; i++) {
      const k = shiftKey(today, i);
      if (keys.has(k)) streak++;
      else break;
    }

    return res.json({ ok: true, streak });
  } catch (err) {
    console.error("Growth streak error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});


    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const jsonText = extractJson(raw);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("Growth JSON parse fail. Raw:", raw);
      return res.status(500).json({
        ok: false,
        message: "AI returned invalid JSON",
        raw: raw.slice(0, 1200),
      });
    }

    const nextProgress = ensureProgress(parsed.progress);
    const nextTodos = ensureTodos(parsed.todos);
    const nextExplanation = String(parsed.explanation || "").slice(0, 1200);

    // Save
    doc.progress = nextProgress;
    doc.todos = nextTodos;
    doc.lastLog = logText;
    doc.lastExplanation = nextExplanation;

    doc.history.unshift({
      logText,
      progress: nextProgress,
      todos: nextTodos,
      explanation: nextExplanation,
    });

    // Keep last 30 logs
    if (doc.history.length > 30) doc.history = doc.history.slice(0, 30);

    await doc.save();

    return res.json({
      ok: true,
      progress: nextProgress,
      todos: nextTodos,
      explanation: nextExplanation,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("Growth evaluate error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
