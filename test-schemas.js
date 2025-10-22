import { GenerateRequestSchema, QuestionSchema } from "./lib/schemas";

// Test the schemas
const testRequest = {
  params: {
    count: 1,
    type: "mcq",
    difficulty: "easy",
    locale: "ru"
  },
  context: {
    text: "Test context"
  }
};

try {
  const parsed = GenerateRequestSchema.parse(testRequest);
  console.log("✅ Request schema validation passed");
  console.log("Parsed request:", JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error("❌ Request schema validation failed:", error);
}

// Test a sample question
const testQuestion = {
  type: "mcq",
  id: "test_1",
  prompt: "What is the capital of France?",
  explanation: "Paris is the capital of France.",
  difficulty: "easy",
  tags: ["geography"],
  choices: ["London", "Paris", "Berlin", "Madrid"],
  answer: 1
};

try {
  const parsedQuestion = QuestionSchema.parse(testQuestion);
  console.log("✅ Question schema validation passed");
  console.log("Parsed question:", JSON.stringify(parsedQuestion, null, 2));
} catch (error) {
  console.error("❌ Question schema validation failed:", error);
}

// Test the schemas
const testRequest = {
  params: {
    count: 1,
    type: "mcq",
    difficulty: "easy",
    locale: "ru"
  },
  context: {
    text: "Test context"
  }
};

try {
  const parsed = GenerateRequestSchema.parse(testRequest);
  console.log("✅ Request schema validation passed");
  console.log("Parsed request:", JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error("❌ Request schema validation failed:", error);
}

// Test a sample question
const testQuestion = {
  type: "mcq",
  id: "test_1",
  prompt: "What is the capital of France?",
  explanation: "Paris is the capital of France.",
  difficulty: "easy",
  tags: ["geography"],
  choices: ["London", "Paris", "Berlin", "Madrid"],
  answer: 1
};

try {
  const parsedQuestion = QuestionSchema.parse(testQuestion);
  console.log("✅ Question schema validation passed");
  console.log("Parsed question:", JSON.stringify(parsedQuestion, null, 2));
} catch (error) {
  console.error("❌ Question schema validation failed:", error);
}
