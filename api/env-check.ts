import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check environment variables (without exposing actual values)
  const envCheck = {
    GROK_API_KEY: !!process.env.GROK_API_KEY,
    HMAC_SECRET: !!process.env.HMAC_SECRET,
    HMAC_KEY_ID: !!process.env.HMAC_KEY_ID,
    MAX_CONTEXT_CHARS: process.env.MAX_CONTEXT_CHARS || "50000 (default)",
    RESPONSE_TIMEOUT_MS: process.env.RESPONSE_TIMEOUT_MS || "8000 (default)",
    NODE_ENV: process.env.NODE_ENV || "undefined",
    VERCEL_ENV: process.env.VERCEL_ENV || "undefined"
  };

  // Check if all required vars are present
  const allRequired = envCheck.GROK_API_KEY && envCheck.HMAC_SECRET && envCheck.HMAC_KEY_ID;

  return res.status(200).json({
    ok: true,
    environment: envCheck,
    allRequiredPresent: allRequired,
    timestamp: new Date().toISOString()
  });
}
