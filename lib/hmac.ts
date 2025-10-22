import { createHmac } from "crypto";

interface HmacVerifyParams {
  body: string;
  providedSignature: string;
  secret: string;
}

export function verifyHmac({ body, providedSignature, secret }: HmacVerifyParams): boolean {
  try {
    // Create HMAC-SHA256 signature
    const hmac = createHmac("sha256", secret);
    hmac.update(body, "utf8");
    const expectedSignature = hmac.digest("hex");
    
    // Compare signatures using constant-time comparison to prevent timing attacks
    return constantTimeEquals(expectedSignature, providedSignature);
  } catch (error) {
    console.error("HMAC verification error:", error);
    return false;
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

export function generateHmac(body: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return hmac.digest("hex");
}
