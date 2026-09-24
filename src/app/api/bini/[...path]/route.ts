import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import catalog from "@/data/bini-shop.json";

// /bini backend WITHOUT any inbound VPS setup.
// Reads: the bot PUSHES a stats snapshot to a secret GitHub gist (outbound
// only); this route reads the gist and serves the requester's own row.
// Auth: Telegram WebApp initData is validated locally with TELEGRAM_BOT_TOKEN
// (HMAC — no network needed), so users can only ever see their own numbers.
// Writes: orders travel page -> bot via Telegram.WebApp.sendData (handled by
// webapp_order_handler in averify.py). This route rejects writes with 410 and
// tells the client the chat command to use instead.
//
// Vercel env needed:
//   TELEGRAM_BOT_TOKEN=...        (same token the bot runs with)
//   BINI_SNAPSHOT_GIST_ID=...     (default below: kaminarich's gist)
//   BINI_GIST_TOKEN=...           (optional PAT with `gist` scope; makes
//                                  secret-gist reads reliable)

export const runtime = "nodejs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const GIST_ID = process.env.BINI_SNAPSHOT_GIST_ID || "cd00ed5a2f25d878c46cd1a5e545e07f";
const GIST_TOKEN = process.env.BINI_GIST_TOKEN || "";
const GIST_USER = "kaminarich";

function validInitData(initData: string): string | null {
  try {
    if (!initData || !BOT_TOKEN) return null;
    const pairs = new URLSearchParams(initData);
    const recv = pairs.get("hash");
    if (!recv) return null;
    pairs.delete("hash");
    const check = [...pairs.keys()]
      .sort()
      .map((k) => `${k}=${pairs.get(k)}`)
      .join("\n");
    const secret = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const calc = createHmac("sha256", secret).update(check).digest("hex");
    const a = Buffer.from(calc);
    const b = Buffer.from(recv);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const authDate = parseInt(pairs.get("auth_date") || "0", 10);
    if (authDate && Math.abs(Date.now() / 1000 - authDate) > 86400) return null;
    const user = JSON.parse(pairs.get("user") || "{}") as { id?: number | string };
    if (!user.id) return null;
    return String(user.id);
  } catch {
    return null;
  }
}

type SnapUser = {
  name: string;
  handle: string;
  mana: number;
  rank_points: number;
  rank_letter: string;
  buffs: Record<string, unknown>;
  collection: number;
  stats: Record<string, number>;
};

async function fetchSnapshot(): Promise<{ updated_at: string | null; users: Record<string, SnapUser> } | null> {
  // Authenticated API read first (reliable for secret gists).
  if (GIST_TOKEN) {
    try {
      const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${GIST_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "rairin-ai-web",
        },
        next: { revalidate: 30 },
      });
      if (r.ok) {
        const j = await r.json();
        const content = j?.files?.["bini-snapshot.json"]?.content as string | undefined;
        if (content) return JSON.parse(content);
      }
    } catch {
      /* try anonymous raw */
    }
  }
  // Anonymous raw read (works for secret gists when the URL is known).
  try {
    const r = await fetch(
      `https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw/bini-snapshot.json`,
      { next: { revalidate: 30 } }
    );
    if (r.ok) return (await r.json()) as { updated_at: string | null; users: Record<string, SnapUser> };
  } catch {
    /* no snapshot yet */
  }
  return null;
}

export async function GET() {
  // Catalog mirror ships with the app (same ids/costs as averify.py SHOP_ITEMS).
  return NextResponse.json({ ok: true, catalog });
}

const WRITE_FALLBACK: Record<string, string> = {
  buy: "/buy <item>",
  salvage: "/salvage <ID>",
  convert: "/convert <pts>",
};

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

  // Writes never go through here — the page sends them via Telegram sendData.
  if (action !== "me") {
    return NextResponse.json(
      {
        ok: false,
        channel: "telegram",
        error: `Orders travel through Telegram. Tap Buy again inside the app, or run ${WRITE_FALLBACK[action]} in chat.`,
        command: WRITE_FALLBACK[action],
      },
      { status: 410 }
    );
  }

  const uid = validInitData(String(body.initData || ""));
  if (!uid) {
    const reason = BOT_TOKEN ? "invalid initData (open via the bot's /shop or Menu button)" : "server misconfigured (TELEGRAM_BOT_TOKEN missing)";
    return NextResponse.json({ ok: false, error: reason }, { status: 401 });
  }
  const snap = await fetchSnapshot();
  if (!snap) {
    return NextResponse.json(
      { ok: false, error: "No records published yet — the bot pushes them every couple of minutes. Try again shortly." },
      { status: 503 }
    );
  }
  const row = snap.users?.[uid];
  if (!row) {
    return NextResponse.json(
      { ok: false, error: "No record for thee yet — use /getbini in the bot first, then refresh." },
      { status: 404 }
    );
  }
  return NextResponse.json({
    ok: true,
    snapshot_at: snap.updated_at,
    user: {
      id: uid,
      name: row.name,
      handle: row.handle ? `@${String(row.handle).replace(/^@/, "")}` : "",
      mana: row.mana,
      rank_points: row.rank_points,
      rank_letter: row.rank_letter,
      buffs: row.buffs,
      collection: row.collection,
      stats: row.stats,
    },
  });
}
