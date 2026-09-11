import assert from "node:assert/strict";
import test from "node:test";

process.env.PAYMENT_TOKEN_SECRET = "test-secret-with-at-least-thirty-two-characters";

test("signs and reads payment token", async () => {
  const { createPaymentToken, readPaymentToken } = await import("./paymentToken");
  const expiresAt = Date.now() + 300_000;
  const created = createPaymentToken("DEVICE-123", expiresAt);
  const parsed = readPaymentToken(created.token);

  assert.equal(parsed?.orderId, created.orderId);
  assert.equal(parsed?.serial, "DEVICE-123");
  assert.equal(parsed?.expiresAt, expiresAt);
});

test("rejects modified payment token", async () => {
  const { createPaymentToken, readPaymentToken } = await import("./paymentToken");
  const created = createPaymentToken("DEVICE-123", Date.now() + 300_000);
  assert.equal(readPaymentToken(`${created.token}x`), null);
});
