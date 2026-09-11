import assert from "node:assert/strict";
import test from "node:test";
import { paidInvoice, paymentStatus } from "./midtrans";

test("maps settled Midtrans QRIS to paid", () => {
  assert.equal(paymentStatus({ transaction_status: "settlement" }), "paid");
});

test("requires accepted capture before marking paid", () => {
  assert.equal(paymentStatus({ transaction_status: "capture", fraud_status: "challenge" }), "pending");
  assert.equal(paymentStatus({ transaction_status: "capture", fraud_status: "accept" }), "paid");
});

test("maps terminal Midtrans statuses", () => {
  assert.equal(paymentStatus({ transaction_status: "expire" }), "expired");
  assert.equal(paymentStatus({ transaction_status: "deny" }), "failed");
  assert.equal(paymentStatus({ transaction_status: "cancel" }), "cancelled");
});

test("accepts only paid RaiRin invoice with expected amount and serial", () => {
  assert.deepEqual(paidInvoice({
    custom_field1: "DEVICE-123",
    gross_amount: "15000.00",
    order_id: "RAIRIN-ORDER-1",
    transaction_status: "settlement",
  }), {
    amount: 15000,
    orderId: "RAIRIN-ORDER-1",
    paidAt: undefined,
    serial: "DEVICE-123",
    transactionId: undefined,
  });
  assert.equal(paidInvoice({
    custom_field1: "DEVICE-123",
    gross_amount: "10000.00",
    order_id: "RAIRIN-ORDER-2",
    transaction_status: "settlement",
  }), null);
});
