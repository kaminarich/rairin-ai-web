import { NextResponse } from "next/server";
import catalog from "@/data/bini-shop.json";

// Proxy between the /bini WebApp page and the Telegram bot's BINI shop API.
// VPS copy-paste: set BINI_API_URL to the bot API public URL, e.g.
//   BINI_API_URL=https://bot.example.com/bini-api
// (bot side: BINI_API_ENABLED=1 + reverse-proxy 127.0.0.1:5600 with HTTPS).
// When unset/unreachable the page falls back to demo mode (localStorage).

export const runtime = "nodejs";

const BOT_API = (process.env.BINI_API_URL || "").replace(/\/$/, "");

async function forward(path: string, body: unknown) {
  if (!BOT_API) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${BOT_API}/api/bini/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  // Catalog is bundled locally so the shop renders even without the bot.
  // Try live first so costs stay in sync with averify.py SHOP_ITEMS.
  if (BOT_API) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${BOT_API}/api/bini/catalog`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.ok) {
        const live = await res.json();
        if (live && live.ok !== false) {
          return NextResponse.json({ ok: true, live: true, catalog: live });
        }
      }
    } catch {
      // fall through to bundled catalog
    } finally {
      clearTimeout(timer);
    }
  }
  return NextResponse.json({ ok: true, live: false, catalog });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const action = (path || []).join("/");
  if (!["me", "buy", "salvage", "convert"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 404 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const upstream = await forward(action, body);
  if (!upstream) {
    // Tell the client to use demo mode (opened outside Telegram / bot offline).
    return NextResponse.json(
      { ok: false, demo: true, error: "Bot API unreachable. Demo mode." },
      { status: 502 }
    );
  }
  return NextResponse.json(upstream.data, { status: upstream.status });
}
