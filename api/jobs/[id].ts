import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
const { id } = req.query as { id: string };
return res.status(200).json({ status: "running", jobId: id });
}