import { createHash, timingSafeEqual } from "node:crypto";

export const QRIS_AMOUNT = 15_000;
export const QRIS_EXPIRY_SECONDS = 5 * 60;

export type PaymentStatus = "pending" | "paid" | "expired" | "failed" | "cancelled";

export type MidtransResponse = {
  actions?: { name?: string; url?: string }[];
  expiry_time?: string;
  fraud_status?: string;
  gross_amount?: string;
  order_id?: string;
  qr_string?: string;
  settlement_time?: string;
  signature_key?: string;
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  transaction_status?: string;
  custom_field1?: string;
};

function config() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not configured");

  const sandbox = process.env.MIDTRANS_SANDBOX === "true";
  return {
    serverKey,
    baseUrl: sandbox ? "https://api.sandbox.midtrans.com/v2" : "https://api.midtrans.com/v2",
  };
}

async function request(path: string, init: RequestInit) {
  const { serverKey, baseUrl } = config();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json()) as MidtransResponse;

  if (!response.ok) {
    throw new Error(data.status_message || `Midtrans request failed (${response.status})`);
  }

  return data;
}

export function paymentStatus(data: MidtransResponse): PaymentStatus {
  const status = data.transaction_status?.toLowerCase();
  if (status === "settlement" || (status === "capture" && data.fraud_status === "accept")) return "paid";
  if (status === "expire") return "expired";
  if (status === "cancel") return "cancelled";
  if (status === "deny" || status === "failure") return "failed";
  return "pending";
}

export async function createQris(orderId: string, serial: string) {
  const data = await request("/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: { order_id: orderId, gross_amount: QRIS_AMOUNT },
      item_details: [{ id: "rairin-license", price: QRIS_AMOUNT, quantity: 1, name: "RaiRin-AI permanent license" }],
      custom_field1: serial,
      metadata: { serial },
      qris: { acquirer: "gopay" },
      custom_expiry: { expiry_duration: QRIS_EXPIRY_SECONDS, unit: "second" },
    }),
  });

  const qrImageUrl = data.actions?.find((action) => action.name === "generate-qr-code-v2")?.url
    || data.actions?.find((action) => action.name === "generate-qr-code")?.url;
  if (!data.qr_string && !qrImageUrl) throw new Error("Midtrans did not return QRIS data");

  return {
    qrImageUrl,
    qrString: data.qr_string,
    transactionId: data.transaction_id,
  };
}

export async function getPaymentStatus(orderId: string) {
  const data = await request(`/${encodeURIComponent(orderId)}/status`, { method: "GET" });
  return {
    amount: Number(data.gross_amount),
    orderId: data.order_id,
    paidAt: data.settlement_time,
    status: paymentStatus(data),
    transactionId: data.transaction_id,
  };
}

export function verifyWebhook(data: MidtransResponse) {
  const { serverKey } = config();
  const expected = createHash("sha512")
    .update(`${data.order_id ?? ""}${data.status_code ?? ""}${data.gross_amount ?? ""}${serverKey}`)
    .digest("hex");
  const supplied = data.signature_key ?? "";

  return supplied.length === expected.length
    && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export function paidInvoice(data: MidtransResponse) {
  const amount = Number(data.gross_amount);
  const serial = data.custom_field1?.trim();
  if (paymentStatus(data) !== "paid" || data.order_id?.startsWith("RAIRIN-") !== true) return null;
  if (amount !== QRIS_AMOUNT || !serial || !/^[A-Za-z0-9._:-]{4,128}$/.test(serial)) return null;

  return {
    amount,
    orderId: data.order_id,
    paidAt: data.settlement_time,
    serial,
    transactionId: data.transaction_id,
  };
}
