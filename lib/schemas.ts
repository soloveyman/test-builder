import { z } from "zod";

// Request schema
export const GenerateRequestSchema = z.object({
  params: z.object({
    count: z.number().int().min(1).max(20),
    type: z.enum(["mcq", "mcq_single", "mcq_multi", "tf", "complete", "cloze", "match", "order", "mixed"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    locale: z.enum(["ru", "en"])
  }),
  context: z.object({
    text: z.string().optional(),
    facts: z.array(z.any()).optional(),
    steps: z.array(z.any()).optional(),
    definitions: z.array(z.any()).optional()
  }),
  sourceRefs: z.array(z.string()).optional()
});

// MCQ single choice
const McqSingleSchema = z.object({
  type: z.literal("mcq_single"),
  choices: z.array(z.string()).min(3).max(5),
  answer: z.number().int(),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
});

// MCQ multiple choice
const McqMultiSchema = z.object({
  type: z.literal("mcq_multi"),
  choices: z.array(z.string()).min(4).max(6),
  answer: z.array(z.number().int()).min(2).max(3),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
});

// True/False
const TfSchema = z.object({
  type: z.literal("tf"),
  answer: z.boolean(),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
});


// Complete (один пропуск, ответ строкой ≤20 символов)
const CompleteSchema = z.object({
  type: z.literal("complete"),
  answer: z.string().min(1).max(20),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
}).superRefine((q, ctx) => {
  if (!q.prompt.includes("__")) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "prompt must contain __ placeholder" });
});

// Cloze (несколько пропусков с вариантами)
const ClozeSchema = z.object({
  type: z.literal("cloze"),
  choices: z.record(z.string(), z.array(z.string()).min(2)),
  answer: z.record(z.string(), z.number().int()),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
}).superRefine((q, ctx) => {
  const keys = Object.keys(q.choices);
  if (keys.length === 0 || keys.length > 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cloze supports 1..3 blanks" });
  for (const k of Object.keys(q.answer)) {
    if (!q.choices[k]) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `answer key ${k} not in choices` });
    const i = q.answer[k];
    const n = q.choices[k]?.length ?? 0;
    if (!(i >= 0 && i < n)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `answer index out of range for ${k}` });
  }
});

// Match (соответствие)
const MatchPair = z.object({ 
  left: z.string(), 
  rightOptions: z.array(z.string()).min(2), 
  answer: z.number().int() 
}).superRefine((p, ctx) => { 
  if (p.answer < 0 || p.answer >= p.rightOptions.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pair answer index out of range" }); 
});

const MatchSchema = z.object({ 
  type: z.literal("match"), 
  pairs: z.array(MatchPair).min(3),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
});

// Order (упорядочивание)
const OrderSchema = z.object({
  type: z.literal("order"),
  choices: z.array(z.string()).min(3),
  answer: z.array(z.number().int()),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
}).superRefine((q, ctx) => {
  const n = q.choices.length;
  if (q.answer.length !== n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "answer must be a permutation of all indices" });
  const uniq = new Set(q.answer);
  if (uniq.size !== n || !q.answer.every((i: number) => i >= 0 && i < n)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "answer must include each index exactly once" });
});

// Mixed type (alias for mcq)
const McqSchema = z.object({
  type: z.literal("mcq"),
  choices: z.array(z.string()).min(3).max(5),
  answer: z.number().int(),
  id: z.string().min(1),
  prompt: z.string().min(10),
  explanation: z.string().min(5),
  source: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([])
});

export const QuestionSchema = z.union([
  McqSchema,
  McqSingleSchema,
  McqMultiSchema,
  TfSchema,
  CompleteSchema,
  ClozeSchema,
  MatchSchema,
  OrderSchema
]);

export const GenerateResponseSchema = z.object({
  ok: z.literal(true),
  provider: z.literal("deepseek"),
  durationMs: z.number().int(),
  questions: z.array(QuestionSchema),
  warnings: z.array(z.string()).default([])
});