// Debug what Groq is actually returning
import crypto from 'crypto';

const API_URL = 'https://test-builder-gamma.vercel.app/api/generate';
const HMAC_SECRET = '58279e7ddb8fee60c66e2339e5f15228';
const HMAC_KEY_ID = 'groqtest';

function generateHmac(body, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return hmac.digest("hex");
}

async function debugGroqResponse() {
  console.log("🔍 Debugging Groq Response...");
  
  const requestBody = {
    params: {
      count: 1, // Just 1 question for easier debugging
      difficulty: "easy",
      locale: "en",
      questionTypes: ["mcq"]
    },
    context: {
      text: "JavaScript is a programming language used for web development."
    }
  };

  const bodyString = JSON.stringify(requestBody);
  const signature = generateHmac(bodyString, HMAC_SECRET);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key-id': HMAC_KEY_ID,
        'x-signature': signature
      },
      body: bodyString
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ API Response:");
      console.log("Provider:", result.provider);
      console.log("Duration:", result.durationMs + "ms");
      console.log("Questions count:", result.questions?.length || 0);
      console.log("Warnings count:", result.warnings?.length || 0);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log("\n⚠️  Warnings (first 3):");
        result.warnings.slice(0, 3).forEach((w, i) => {
          console.log(`${i + 1}. ${w.substring(0, 100)}...`);
        });
      }
      
    } else {
      console.log("❌ API Error:", response.status);
      console.log("Error:", result);
    }

  } catch (error) {
    console.error("💥 Request failed:", error.message);
  }
}

debugGroqResponse();
