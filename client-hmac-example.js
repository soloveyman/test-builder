// Client-side HMAC generation example
// This shows how to properly generate HMAC signatures for the API

import crypto from 'crypto';

// Example client implementation
class TestBuilderClient {
  constructor(apiKey, secret, keyId) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.keyId = keyId;
    this.baseUrl = 'https://test-builder-gamma.vercel.app';
  }

  generateHmac(body) {
    const hmac = crypto.createHmac("sha256", this.secret);
    hmac.update(body, "utf8");
    return hmac.digest("hex");
  }

  async generateQuestions(params) {
    const requestBody = {
      params: {
        count: params.count || 5,
        difficulty: params.difficulty || "medium",
        locale: params.locale || "en",
        questionTypes: params.questionTypes || ["mcq", "tf"]
      },
      context: {
        text: params.contextText || "",
        facts: params.facts || [],
        steps: params.steps || [],
        definitions: params.definitions || []
      },
      sourceRefs: params.sourceRefs || []
    };

    const bodyString = JSON.stringify(requestBody);
    const signature = this.generateHmac(bodyString);

    console.log("Request body:", bodyString);
    console.log("Generated signature:", signature);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key-id': this.keyId,
          'x-signature': signature
        },
        body: bodyString
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error(`API Error ${response.status}:`, result);
        throw new Error(`API Error: ${result.error || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      console.error("Request failed:", error);
      throw error;
    }
  }
}

// Example usage
async function testClient() {
  // Replace with your actual values
  const client = new TestBuilderClient(
    "your-api-key", // This is not used in HMAC but might be needed for other auth
    "your-hmac-secret", // This should match HMAC_SECRET in Vercel
    "your-key-id" // This should match HMAC_KEY_ID in Vercel
  );

  try {
    const result = await client.generateQuestions({
      count: 3,
      difficulty: "easy",
      locale: "en",
      contextText: "JavaScript is a programming language used for web development.",
      questionTypes: ["mcq", "tf"]
    });

    console.log("Success:", result);
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testClient();
}

export { TestBuilderClient };
