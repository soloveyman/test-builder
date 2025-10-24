// Test raw Groq API directly to see what it returns
import crypto from 'crypto';

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // Replace with your actual key

async function testRawGroq() {
  console.log("🔍 Testing Raw Groq API...");
  
  const messages = [
    {
      role: "system",
      content: `You generate exam questions for HoReCa staff. Use ONLY the provided context. No external knowledge.
      Return ONLY a pure JSON array of questions with MIXED TYPES. No explanations, no markdown, no additional text - just the JSON array.
      Automatically choose appropriate question types based on context.
      Supported types: mcq_single (alias mcq), mcq_multi, tf, complete, cloze, match, order.
      
      MIXING STRATEGY:
      - 40-50%: mcq_single/mcq (main questions)
      - 20-30%: tf (simple checks)
      - 15-25%: complete (fill-in-the-blank)
      - 10-20%: mcq_multi (complex multiple choice)
      - 5-15%: cloze/match/order (special formats)
      
      Rules similar to RU above. Output language: en.`
    },
    {
      role: "user", 
      content: `Параметры:
– Количество: 1;
– Сложность: easy; язык: en.
– Типы вопросов: mcq.
Контекст (фрагменты документа):
JavaScript is a programming language used for web development.

Просьба: формулируй чётко, не копируй большие куски, обязательно добавляй краткое объяснение и source, если можно. Создавай разнообразные типы вопросов для лучшего тестирования знаний.`
    }
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "test-builder-service/1.2.0"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("📝 Raw Groq Response:");
    console.log("=" * 50);
    console.log(content);
    console.log("=" * 50);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      console.log("\n✅ Successfully parsed as JSON:");
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log("\n❌ Failed to parse as JSON:");
      console.log("Error:", parseError.message);
      
      // Try to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log("\n🔍 Found JSON array in response:");
        console.log(jsonMatch[0]);
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log("\n✅ Successfully parsed extracted JSON:");
          console.log(JSON.stringify(extracted, null, 2));
        } catch (extractError) {
          console.log("❌ Failed to parse extracted JSON:", extractError.message);
        }
      }
    }

  } catch (error) {
    console.error("💥 Request failed:", error.message);
  }
}

testRawGroq();
