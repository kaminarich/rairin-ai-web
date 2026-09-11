import { NextResponse } from "next/server";
import { getPaymentStatus, QRIS_AMOUNT } from "@/lib/midtrans";
import { readPaymentToken } from "@/lib/paymentToken";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { token } = await request.json() as { token?: unknown };
    if (typeof token !== "string") return NextResponse.json({ error: "Invalid payment token." }, { status: 400 });

    const payment = readPaymentToken(token);
    if (!payment) return NextResponse.json({ error: "Invalid payment token." }, { status: 400 });
    if (Date.now() > payment.expiresAt + 60 * 60 * 1000) {
      return NextResponse.json({ error: "Payment token expired." }, { status: 410 });
    }

    const result = await getPaymentStatus(payment.orderId);
    if (result.orderId !== payment.orderId || result.amount !== QRIS_AMOUNT) {
      return NextResponse.json({ error: "Payment details did not match." }, { status: 409 });
    }
    return NextResponse.json({
      expiresAt: payment.expiresAt,
      paidAt: result.paidAt,
      serial: payment.serial,
      status: result.status,
      verificationId: result.transactionId || payment.orderId,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("QRIS status check failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not check payment status." }, { status: 502 });
  }
}
