// Test with corrected GROQ_API_KEY
import crypto from 'crypto';

const API_URL = 'https://test-builder-gamma.vercel.app/api/generate';
const HMAC_SECRET = '58279e7ddb8fee60c66e2339e5f15228';
const HMAC_KEY_ID = 'groqtest';

function generateHmac(body, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return hmac.digest("hex");
}

async function testAPI() {
  console.log("🚀 Testing API with corrected GROQ_API_KEY...");
  
  const requestBody = {
    params: {
      count: 2,
      difficulty: "easy",
      locale: "en",
      questionTypes: ["mcq", "tf"]
    },
    context: {
      text: "JavaScript is a programming language used for web development. It supports both object-oriented and functional programming paradigms.",
      facts: ["JavaScript was created in 1995", "It runs in web browsers"],
      steps: ["Write code", "Test in browser", "Debug issues"],
      definitions: ["Variable: container for data", "Function: reusable code block"]
    },
    sourceRefs: ["MDN Web Docs", "JavaScript.info"]
  };

  const bodyString = JSON.stringify(requestBody);
  const signature = generateHmac(bodyString, HMAC_SECRET);

  console.log("📊 Request details:");
  console.log("- Body length:", bodyString.length);
  console.log("- Signature:", signature.substring(0, 16) + "...");
  console.log("- Key ID:", HMAC_KEY_ID);

  try {
    console.log("\n📡 Sending request...");
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key-id': HMAC_KEY_ID,
        'x-signature': signature
      },
      body: bodyString
    });

    console.log("📈 Response status:", response.status);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("\n✅ SUCCESS! API is working correctly");
      console.log("🎯 Provider:", result.provider);
      console.log("⏱️  Duration:", result.durationMs + "ms");
      console.log("❓ Questions generated:", result.questions?.length || 0);
      console.log("⚠️  Warnings:", result.warnings?.length || 0);
      
      if (result.questions && result.questions.length > 0) {
        console.log("\n📝 Sample questions:");
        result.questions.forEach((q, i) => {
          console.log(`${i + 1}. ${q.type.toUpperCase()}: ${q.prompt.substring(0, 60)}...`);
          console.log(`   Quality: ${q.quality}, Difficulty: ${q.difficulty}`);
        });
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        result.warnings.forEach(w => console.log(`- ${w}`));
      }
      
    } else {
      console.log("\n❌ API Error:", response.status);
      console.log("Error details:", result);
      
      if (response.status === 401) {
        console.log("\n🔍 HMAC Debug Info:");
        console.log("- HMAC authentication failed");
        console.log("- Check that credentials match exactly in Vercel");
      } else if (response.status === 503) {
        console.log("\n🔍 Service Error:");
        console.log("- This might be a Groq API issue or environment variable problem");
        console.log("- Make sure GROQ_API_KEY is set in Vercel (not GROK_API_KEY)");
      }
    }

  } catch (error) {
    console.error("\n💥 Request failed:", error.message);
  }
}

testAPI();
