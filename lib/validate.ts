import { QuestionSchema } from "./schemas.js";

// Normalize question object to ensure consistent structure
function normalize(obj: any): any {
  const q = { ...obj };
  
  // Ensure id exists
  if (!q.id) {
    q.id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Normalize choices for MCQ types
  if (q.type === "mcq" || q.type === "mcq_single" || q.type === "mcq_multi") {
    if (typeof q.choices === "object" && !Array.isArray(q.choices)) {
      q.choices = Object.keys(q.choices).map(key => q.choices[key]);
    }
  }
  
  return q;
}

// Extract text content from question for grounding analysis
function textFromQuestion(q: any): string {
  const parts: string[] = [];
  
  if (q.prompt) parts.push(q.prompt);
  if (q.explanation) parts.push(q.explanation);
  if (q.source) parts.push(q.source);
  
  if (q.choices && Array.isArray(q.choices)) {
    parts.push(...q.choices);
  }
  
  if (q.pairs && Array.isArray(q.pairs)) {
    q.pairs.forEach((pair: any) => {
      if (pair.left) parts.push(pair.left);
      if (pair.rightOptions) parts.push(...pair.rightOptions);
    });
  }
  
  if (q.choices && typeof q.choices === "object") {
    Object.keys(q.choices).forEach((key: string) => {
      const choice = q.choices[key];
      if (Array.isArray(choice)) {
        parts.push(...choice);
      }
    });
  }
  
  return parts.join(" ").toLowerCase();
}

// Calculate grounding score based on context overlap
function groundingScore(questionText: string, contextText: string): number {
  if (!contextText || !questionText) return 0;
  
  const contextWords = new Set(contextText.toLowerCase().split(/\s+/));
  const questionWords = questionText.split(/\s+/);
  
  if (questionWords.length === 0) return 0;
  
  let matches = 0;
  for (const word of questionWords) {
    if (contextWords.has(word)) {
      matches++;
    }
  }
  
  return matches / questionWords.length;
}


function avgLen(arr: string[]) { return arr.reduce((a, b) => a + b.length, 0) / Math.max(1, arr.length); }


export function validateAndScoreQuestions({ raw, contextText, minGrounding = 0.25 }: { raw: any; contextText: string; minGrounding?: number; }) {
const arr = Array.isArray(raw) ? raw : [];
const valid: any[] = [];
const warnings: string[] = [];
const typeCounts: Record<string, number> = {};


for (const item of arr) {
try {
const q = normalize(item);
const parsed = QuestionSchema.parse(q);


// Heuristics по типам
if (parsed.type === "mcq" || parsed.type === "mcq_single") {
const ch = (parsed as any).choices as string[];
const uniq = new Set(ch);
if (uniq.size !== ch.length) { warnings.push(`mcq duplicate choices id=${(parsed as any).id}`); continue; }
if (typeof (parsed as any).answer !== "number") { warnings.push(`mcq invalid answer id=${(parsed as any).id}`); continue; }
const mean = avgLen(ch);
if (ch.some(c => c.length < mean * 0.6 || c.length > mean * 1.4)) warnings.push(`mcq uneven distractors id=${(parsed as any).id}`);
}


if (parsed.type === "mcq_multi") {
const ch = (parsed as any).choices as string[];
const ans = (parsed as any).answer as number[];
const mean = avgLen(ch);
if (ch.some(c => c.length < mean * 0.6 || c.length > mean * 1.4)) warnings.push(`mcq_multi uneven distractors id=${(parsed as any).id}`);
if (ans.length < 2) { warnings.push(`mcq_multi needs >=2 correct id=${(parsed as any).id}`); continue; }
}


if (parsed.type === "order") {
const n = ((parsed as any).choices as string[]).length;
const uniq = new Set((parsed as any).answer as number[]);
if (uniq.size !== n) { warnings.push(`order answer must be permutation id=${(parsed as any).id}`); continue; }
}


if (parsed.type === "match") {
if ((parsed as any).pairs.length < 3) { warnings.push(`match needs >=3 pairs id=${(parsed as any).id}`); continue; }
}


if (parsed.type === "complete") {
if (!(parsed as any).prompt.includes("__")) { warnings.push(`complete requires __ placeholder id=${(parsed as any).id}`); continue; }
}


if (parsed.type === "cloze") {
const keys = Object.keys((parsed as any).choices as Record<string, string[]>);
if (keys.length === 0 || keys.length > 3) { warnings.push(`cloze supports 1..3 blanks id=${(parsed as any).id}`); continue; }
}


// Grounding
const g = groundingScore(textFromQuestion(parsed), contextText);
if (g < minGrounding) { warnings.push(`low grounding (${g.toFixed(2)}) id=${(parsed as any).id}`); continue; }

// Track question types for mixed generation feedback
const questionType = (parsed as any).type;
typeCounts[questionType] = (typeCounts[questionType] || 0) + 1;

valid.push({ ...parsed, quality: Number(g.toFixed(2)) });
} catch (e: any) {
warnings.push(`schema error: ${e.message}`);
}
}

// Add mixed generation feedback
const totalQuestions = valid.length;
if (totalQuestions > 0) {
const typeDistribution = Object.entries(typeCounts)
.map(([type, count]) => `${type}: ${count} (${Math.round(count/totalQuestions*100)}%)`)
.join(', ');
warnings.push(`Generated mixed types: ${typeDistribution}`);
}

return { questions: valid, warnings };
}