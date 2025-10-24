import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GenerateRequestSchema } from "../lib/schemas.js";
import { buildSystemPrompt, buildUserPrompt } from "../lib/prompt.js";
import { callGrokJSON } from "../lib/grok.js";
import { verifyHmac } from "../lib/hmac.js";
import { validateAndScoreQuestions } from "../lib/validate.js";


export default async function handler(req: VercelRequest, res: VercelResponse) {
const started = Date.now();
if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });


// HMAC
const keyId = req.headers["x-key-id"]; 
const sig = req.headers["x-signature"] as string | undefined;

console.log("HMAC Debug:", { 
  keyId: !!keyId, 
  sig: !!sig, 
  hasSecret: !!process.env.HMAC_SECRET,
  bodyLength: typeof req.body === "string" ? req.body.length : JSON.stringify(req.body ?? {}).length
});

if (!keyId || !sig) {
  console.error("Missing HMAC headers:", { keyId: !!keyId, sig: !!sig });
  return res.status(401).json({ ok: false, error: "Missing HMAC headers" });
}

const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
const secret = process.env.HMAC_SECRET!;

if (!secret) {
  console.error("HMAC_SECRET environment variable not set");
  return res.status(500).json({ ok: false, error: "Server configuration error" });
}

if (!verifyHmac({ body: bodyString, providedSignature: sig, secret })) {
  console.error("HMAC verification failed:", { 
    providedSig: sig.substring(0, 8) + "...", 
    bodyHash: bodyString.substring(0, 50) + "..." 
  });
  return res.status(401).json({ ok: false, error: "Bad signature" });
}


// Вход
let input: any;
try {
input = GenerateRequestSchema.parse(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
} catch (e: any) {
return res.status(400).json({ ok: false, error: e.message });
}


const { params, context, sourceRefs } = input;
const contextText = [context.text, JSON.stringify({ facts: context.facts, steps: context.steps, definitions: context.definitions })]
.filter(Boolean).join("\n").slice(0, Number(process.env.MAX_CONTEXT_CHARS || 50000));


// Промпты
const system = buildSystemPrompt(params.locale);
const user = buildUserPrompt({
count: params.count, difficulty: params.difficulty, locale: params.locale,
contextText: context.text, facts: context.facts, steps: context.steps, definitions: context.definitions, sourceRefs,
questionTypes: params.questionTypes
});


try {
console.log("Calling Grok API...");
const llm = await callGrokJSON({ system, user });
console.log("Grok API response received, parsing...");

let raw: any;
try {
raw = JSON.parse(llm.content);
} catch (parseError) {
console.warn("Failed to parse Grok response as JSON, attempting fallback:", parseError);
console.log("Raw response:", llm.content?.substring(0, 200) + "...");

// Try to extract JSON from the response
let jsonContent = llm.content || "{}";
const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
if (jsonMatch) {
  jsonContent = jsonMatch[0];
  console.log("Extracted JSON array:", jsonContent.substring(0, 100) + "...");
}

try {
  const maybe = JSON.parse(jsonContent);
  raw = Array.isArray(maybe) ? maybe : (maybe.questions || []);
} catch (secondError) {
  console.error("Second JSON parse attempt failed:", secondError);
  raw = [];
}
}

console.log(`Parsed ${Array.isArray(raw) ? raw.length : 0} questions from Grok`);

const { questions, warnings } = validateAndScoreQuestions({ raw, contextText });

console.log(`Validated ${questions.length} questions, ${warnings.length} warnings`);

return res.status(200).json({
ok: true,
provider: "grok",
durationMs: Date.now() - started,
questions,
warnings
});
} catch (e: any) {
console.error("Grok API error:", {
  message: e?.message,
  name: e?.name,
  stack: e?.stack?.substring(0, 200)
});

const message = e?.message || "Provider error";
return res.status(503).json({ ok: false, error: message });
}
}