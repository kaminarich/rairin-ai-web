import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type PaymentToken = {
  expiresAt: number;
  orderId: string;
  serial: string;
};

function secret() {
  const value = process.env.PAYMENT_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("PAYMENT_TOKEN_SECRET must contain at least 32 characters");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createPaymentToken(serial: string, expiresAt: number) {
  const orderId = `RAIRIN-${Date.now().toString(36).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
  const payload = Buffer.from(JSON.stringify({ expiresAt, orderId, serial })).toString("base64url");
  return { orderId, token: `${payload}.${signature(payload)}` };
}

export function readPaymentToken(token: string): PaymentToken | null {
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;

  const expected = signature(payload);
  if (supplied.length !== expected.length
    || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PaymentToken;
    if (!value.orderId || !value.serial || !Number.isFinite(value.expiresAt)) return null;
    return value;
  } catch {
    return null;
  }
}
