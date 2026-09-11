import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { paidInvoice, paymentStatus, verifyWebhook } from "@/lib/midtrans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!verifyWebhook(body)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

    const status = paymentStatus(body);
    const invoice = paidInvoice(body);
    if (invoice) await fulfillPaidOrder(invoice);

    return NextResponse.json({ fulfilled: Boolean(invoice), status });
  } catch (error) {
    console.error("Midtrans webhook failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
  }
}
