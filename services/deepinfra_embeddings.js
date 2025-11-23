const axios = require("axios");
const MODEL_URL = "https://api.deepinfra.com/v1/inference/BAAI/bge-base-en-v1.5";

async function embedText(text) {
  if (!text || !text.trim()) return null;
  try {
    const response = await axios.post(
      MODEL_URL,
      { inputs: [text] },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );
    const emb = response.data.embeddings?.[0];
    return emb || null;
  } catch (err) {
    console.error("DeepInfra Embedding Error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { embedText };
