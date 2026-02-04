const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ===================== HELPERS ===================== */

function extractJson(text = "") {
  let cleaned = text.replace(/```json|```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return cleaned;
}

function clampPct(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function safeArray(v, max = 20) {
  if (!Array.isArray(v)) return [];
  return v.filter(Boolean).map(String).slice(0, max);
}

/* ===================== ROUTE ===================== */
/**
 * POST /api/jd/match
 */
router.post("/match", async (req, res) => {
  try {
    const resumeText = String(req.body.resumeText || "").trim();
    const jobDescription = String(req.body.jobDescription || "").trim();

    if (!resumeText) {
      return res.status(400).json({
        ok: false,
        message: "resumeText is required",
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        ok: false,
        message: "jobDescription is required",
      });
    }

    const systemPrompt = `
You are an ATS system and professional recruiter.
Return ONLY valid JSON.
No markdown. No explanations outside JSON.
Be strict, realistic, recruiter-focused.
`;

    const userPrompt = `
Compare the RESUME against the JOB DESCRIPTION.

RESUME:
"""
${resumeText.slice(0, 12000)}
"""

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 12000)}
"""

Return JSON in EXACT structure:

{
  "matchScore": 0,
  "ats": {
    "score": 0,
    "verdict": "pass | borderline | fail",
    "missingSections": [],
    "keywordCoverage": 0,
    "explanation": ""
  },
  "strengths": [],
  "gaps": [],
  "missingKeywords": [],
  "tailoredBulletPoints": [],
  "priorityActions": [],
  "notes": ""
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.25,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const jsonText = extractJson(raw);

    /* ---------- PARSE FIRST (NO TDZ BUG) ---------- */
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("JD MATCH JSON PARSE ERROR:", raw);
      return res.status(500).json({
        ok: false,
        message: "AI returned invalid JSON",
        raw: raw.slice(0, 1000),
      });
    }

    /* ---------- NORMALIZE AFTER PARSE ---------- */
    const result = {
      matchScore: clampPct(parsed.matchScore),

      ats: {
        score: clampPct(parsed?.ats?.score),
        verdict: ["pass", "borderline", "fail"].includes(parsed?.ats?.verdict)
          ? parsed.ats.verdict
          : "fail",
        missingSections: safeArray(parsed?.ats?.missingSections, 10),
        keywordCoverage: clampPct(parsed?.ats?.keywordCoverage),
        explanation: String(parsed?.ats?.explanation || "").slice(0, 600),
      },

      strengths: safeArray(parsed.strengths, 10),
      gaps: safeArray(parsed.gaps, 10),
      missingKeywords: safeArray(parsed.missingKeywords, 20),
      tailoredBulletPoints: safeArray(parsed.tailoredBulletPoints, 10),
      priorityActions: safeArray(parsed.priorityActions, 10),
      notes: String(parsed.notes || "").slice(0, 1200),
    };

    return res.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error("JD MATCH ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
});

module.exports = router;
