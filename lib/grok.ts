interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callGrokJSON({ system, user }: { system: string; user: string }): Promise<GrokResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }

  const messages: GrokMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];

  const requestBody = {
    model: "llama-3.3-70b-versatile", // Grok model
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: false
  };

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = Number(process.env.RESPONSE_TIMEOUT_MS || 8000);
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`Grok API attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "test-builder-service/1.2.0"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Grok API error ${response.status}:`, errorText);
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`Grok API error ${response.status}: ${errorText}`);
        }
        
        // Retry on server errors (5xx) and rate limits (429)
        if (attempt === maxRetries) {
          throw new Error(`Grok API error ${response.status}: ${errorText}`);
        }
        
        console.log(`Retrying in ${baseDelay * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        continue;
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Grok API");
      }

      console.log(`Grok API success on attempt ${attempt}`);
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        if (attempt === maxRetries) {
          throw new Error("Request timeout - Grok API took too long to respond");
        }
        console.log(`Timeout on attempt ${attempt}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        continue;
      }
      
      if (attempt === maxRetries) {
        throw new Error(`Grok API call failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      console.log(`Error on attempt ${attempt}, retrying:`, error.message);
      await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
    }
  }

  throw new Error("Grok API call failed - unexpected error");
}
