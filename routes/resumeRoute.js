// backend/routes/resumeRoute.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");

// Memory storage for uploads
const upload = multer({ storage: multer.memoryStorage() });

// Groq AI setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Extract JSON safely from model response text
 */
function extractJson(text) {
  let cleaned = (text || "").trim();

  // Remove ```json ... ``` fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json/i, "");
    cleaned = cleaned.replace(/^```/, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();
  }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.substring(first, last + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * POST /api/resume/analyze
 */
router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Extract text from PDF
    let extractedText = "";
    try {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text || "";
    } catch (pdfError) {
      console.error("PDF parse error, fallback:", pdfError);
      extractedText = req.file.buffer.toString("utf8");
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        error: "Could not extract text from this resume file.",
      });
    }

    // ✅ Trim for AI prompt safety
    const resumeText =
      extractedText.length > 9000
        ? extractedText.slice(0, 9000)
        : extractedText;

    const prompt = `
You are an expert career coach AND resume consultant.

You will receive a candidate's resume text. You MUST return ONLY a JSON object in this EXACT structure (no extra commentary):

{
  "summary": "1–3 sentence summary of this candidate",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvements": ["improvement suggestion 1", "improvement suggestion 2"],
  "keywordsToAdd": ["keyword 1", "keyword 2"],
  "improvedBulletPoints": ["improved bullet point 1", "improved bullet point 2"],
  "careerPath": {
    "currentStage": "short description of where they are now in their career",
    "shortTermSteps": ["steps for the next 3–6 months"],
    "midTermSteps": ["steps for the next 1–2 years"],
    "longTermSteps": ["steps for the next 3–5 years"],
    "ultimateGoal": "description of their maximum realistic potential role",
    "recommendedRoles": ["role 1", "role 2"],
    "recommendedCourses": ["course or certification 1", "course or certification 2"]
  }
}

Important:
- The analysis MUST be specific to the actual profession and experience in the resume.
- If this person is in hospitality or a cook, focus on kitchen operations, food safety, guest service, hotel operations, etc.
- Steps should feel like a realistic roadmap they can follow.

Now analyze this resume and produce the JSON:

"""${resumeText}"""
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
      max_tokens: 1100,
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    let jsonResult = {};
    try {
      jsonResult = extractJson(raw);
    } catch (err) {
      console.error("AI JSON parse failed:", err, "\nRAW:", raw);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw,
      });
    }

    // ✅ Safety helpers
    const ensureArray = (v) =>
      Array.isArray(v) ? v : v ? [String(v)] : [];

    jsonResult.strengths = ensureArray(jsonResult.strengths);
    jsonResult.weaknesses = ensureArray(jsonResult.weaknesses);
    jsonResult.improvements = ensureArray(jsonResult.improvements);
    jsonResult.keywordsToAdd = ensureArray(jsonResult.keywordsToAdd);
    jsonResult.improvedBulletPoints = ensureArray(
      jsonResult.improvedBulletPoints
    );

    jsonResult.careerPath = jsonResult.careerPath || {};
    const cp = jsonResult.careerPath;

    cp.shortTermSteps = ensureArray(cp.shortTermSteps);
    cp.midTermSteps = ensureArray(cp.midTermSteps);
    cp.longTermSteps = ensureArray(cp.longTermSteps);
    cp.recommendedRoles = ensureArray(cp.recommendedRoles);
    cp.recommendedCourses = ensureArray(cp.recommendedCourses);

    jsonResult.careerPath = cp;

    // ✅ FINAL RESPONSE (AUTO-CONNECT JD MATCH)
    return res.json({
      ok: true,

      // 🔥 THIS is what JD Match will auto-use
      resumeText,

      result: jsonResult,
    });
  } catch (err) {
    console.error("Resume AI Error:", err);
    return res.status(500).json({
      error: "Resume analysis failed",
      message: err.message,
    });
  }
});

module.exports = router;
