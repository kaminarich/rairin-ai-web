import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { createQris, QRIS_AMOUNT, QRIS_EXPIRY_SECONDS } from "@/lib/midtrans";
import { createPaymentToken } from "@/lib/paymentToken";

export const runtime = "nodejs";

function validSerial(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{4,128}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { serial?: unknown };
    const serial = typeof body.serial === "string" ? body.serial.trim() : body.serial;
    if (!validSerial(serial)) {
      return NextResponse.json({ error: "Enter a valid device serial (4-128 letters, numbers, or . _ : -)." }, { status: 400 });
    }

    const expiresAt = Date.now() + QRIS_EXPIRY_SECONDS * 1000;
    const { orderId, token } = createPaymentToken(serial, expiresAt);
    const result = await createQris(orderId, serial);
    const qrImage = result.qrString
      ? await QRCode.toDataURL(result.qrString, { errorCorrectionLevel: "M", margin: 2, width: 360 })
      : result.qrImageUrl;

    return NextResponse.json({
      amount: QRIS_AMOUNT,
      expiresAt,
      orderId,
      qrImage,
      token,
      verificationId: result.transactionId || orderId,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("QRIS creation failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not create QRIS. Try again." }, { status: 502 });
  }
}
