const axios = require("axios");

// Free and stable embedding model
const MODEL_URL = "https://api.deepinfra.com/v1/inference/BAAI/bge-base-en-v1.5";

async function embedText(text) {
  if (!text || !text.trim()) return null;

  try {
    const response = await axios.post(
      MODEL_URL,
      { inputs: [text] },   // MUST be an array
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // DeepInfra returns:
    // {
    //   embeddings: [ [ ....vector.... ] ]
    // }

    const embedding = response.data.embeddings?.[0];

    if (!embedding) {
      console.error("❌ No embedding returned from DeepInfra");
      return null;
    }

    return embedding;

  } catch (err) {
    console.error("DeepInfra Embedding Error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { embedText };
