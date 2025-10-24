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
const keyId = req.headers["x-key-id"]; const sig = req.headers["x-signature"] as string | undefined;
if (!keyId || !sig) return res.status(401).json({ ok: false, error: "Missing HMAC headers" });
const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
const secret = process.env.HMAC_SECRET!;
if (!verifyHmac({ body: bodyString, providedSignature: sig, secret })) {
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
const llm = await callGrokJSON({ system, user });
let raw: any;
try {
raw = JSON.parse(llm.content);
} catch {
const maybe = JSON.parse(llm.content || "{}");
raw = Array.isArray(maybe) ? maybe : (maybe.questions || []);
}


const { questions, warnings } = validateAndScoreQuestions({ raw, contextText });


return res.status(200).json({
ok: true,
provider: "grok",
durationMs: Date.now() - started,
questions,
warnings
});
} catch (e: any) {
const message = e?.message || "Provider error";
return res.status(503).json({ ok: false, error: message });
}
}