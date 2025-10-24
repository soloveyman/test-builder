import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
// Для MVP просто 501
return res.status(202).json({ ok: true, jobId: "job_demo", etaSec: 10 });
}