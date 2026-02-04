// backend/services/ai_recommendation.js
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a career recommendation using Groq Llama 3.1 70B
 */
async function generateCareerRecommendation(input, careers) {
  const prompt = `
You are an AI Career Advisor. Return ONLY valid JSON. No backticks. No explanations.

--- USER PROFILE ---
Skills: ${input.skills.join(", ")}
Interests: ${input.interests.join(", ")}
Work Style: ${input.workStyle || "Not provided"}

--- CAREER DATABASE ---
${careers
  .map(
    (c) => `
Title: ${c.title}
Description: ${c.description}
Required Skills: ${c.requiredSkills.join(", ")}
Related Interests: ${c.relatedInterests.join(", ")}
`
  )
  .join("\n\n")}

--- TASK ---
1. Recommend the BEST possible career for the user based on their skills, interests, and work style.
2. You are NOT limited to the database careers. You may choose ANY career that fits the user well.
3. If a database career is relevant, use it. If not, choose a better external career.
4. Always justify your choice with clear reasoning.
5. Recommend 3 concrete skills the user should learn next.
6. Return JSON ONLY, with this structure:
{
  "careerTitle": "",
  "reasoning": "",
  "motivation": "",
  "suggestedSkills": []
}


Return JSON ONLY:
{
  "careerTitle": "",
  "reasoning": "",
  "motivation": "",
  "suggestedSkills": []
}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 600,
  });

  let raw = response.choices[0].message.content.trim();

  // Fix Markdown code blocks like ```json ... ```
  if (raw.startsWith("```")) {
    raw = raw.replace(/```json/i, "").replace(/```/g, "").trim();
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("JSON parse error from Groq:", err, "\nRAW AI OUTPUT:", raw);
    return {
      careerTitle: "AI Response Error",
      reasoning: "The AI returned invalid JSON.",
      motivation: "",
      suggestedSkills: []
    };
  }
}


module.exports = { generateCareerRecommendation };
