
interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callDeepSeekJSON({ system, user }: { system: string; user: string }): Promise<DeepSeekResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is required");
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];

  const requestBody = {
    model: "deepseek-chat",
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: false
  };

  const controller = new AbortController();
  const timeout = Number(process.env.RESPONSE_TIMEOUT_MS || 8000);
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from DeepSeek API");
    }

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      throw new Error("Request timeout - DeepSeek API took too long to respond");
    }
    
    throw new Error(`DeepSeek API call failed: ${error.message}`);
  }
}
