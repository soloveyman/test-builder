// Final test with instructions for real credentials
import crypto from 'crypto';

const API_URL = 'https://test-builder-gamma.vercel.app/api/generate';

// INSTRUCTIONS: Replace these with your actual values from Vercel dashboard
const HMAC_SECRET = '58279e7ddb8fee60c66e2339e5f15228';
const HMAC_KEY_ID = 'groqtest';

function generateHmac(body, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return hmac.digest("hex");
}

async function testAPI() {
  if (HMAC_SECRET === 'REPLACE_WITH_YOUR_ACTUAL_HMAC_SECRET') {
    console.log("🔧 SETUP REQUIRED:");
    console.log("1. Get your HMAC_SECRET and HMAC_KEY_ID from Vercel dashboard");
    console.log("2. Edit this file and replace the placeholder values");
    console.log("3. Run: node test-final.js");
    console.log("");
    console.log("To get your credentials:");
    console.log("- Go to Vercel dashboard → Your project → Settings → Environment Variables");
    console.log("- Copy the values for HMAC_SECRET and HMAC_KEY_ID");
    return;
  }

  console.log("🚀 Testing API with real credentials...");
  
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
        console.log("- Check that HMAC_SECRET matches exactly in Vercel");
        console.log("- Check that HMAC_KEY_ID matches exactly in Vercel");
        console.log("- Ensure no extra spaces or characters in credentials");
      }
    }

  } catch (error) {
    console.error("\n💥 Request failed:", error.message);
  }
}

testAPI();
