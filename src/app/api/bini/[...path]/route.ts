import { createHmac, randomUUID, timingSafeEqual } from "crypto";
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
  favorite_id?: number | null;
  buffs: Record<string, unknown>;
  collection: number;
  stats: Record<string, number>;
};

type OrderEntry = {
  id: string;
  uid: string;
  action: string;
  item_id?: string;
  bini_id?: string;
  points?: number;
  ts: number;
  status: string;
  message?: string;
};

type OrderDoc = { updated_at: string | null; orders: Record<string, OrderEntry> };

async function fetchGistFile<T>(name: string, revalidate = 30): Promise<T | null> {
  // Authenticated API read first (reliable for secret gists).
  if (GIST_TOKEN) {
    try {
      const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${GIST_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "rairin-ai-web",
        },
        next: { revalidate },
      });
      if (r.ok) {
        const j = await r.json();
        const content = j?.files?.[name]?.content as string | undefined;
        if (content) return JSON.parse(content) as T;
      }
    } catch {
      /* try anonymous raw */
    }
  }
  // Anonymous raw read (works for secret gists when the URL is known).
  try {
    const r = await fetch(
      `https://gist.githubusercontent.com/${GIST_USER}/${GIST_ID}/raw/${name}`,
      { next: { revalidate } }
    );
    if (r.ok) return (await r.json()) as T;
  } catch {
    /* not published yet */
  }
  return null;
}

async function fetchSnapshot(): Promise<{ updated_at: string | null; build?: string; users: Record<string, SnapUser> } | null> {
  return fetchGistFile<{ updated_at: string | null; build?: string; users: Record<string, SnapUser> }>("bini-snapshot.json", 10);
}

async function readOrders(): Promise<OrderDoc | null> {
  return fetchGistFile<OrderDoc>("bini-orders.json", 5);
}

async function readCollections(): Promise<{ updated_at: string | null; users: Record<string, [number, string, string][]> } | null> {
  return fetchGistFile<{ updated_at: string | null; users: Record<string, [number, string, string][]> }>("bini-collections.json", 15);
}

async function writeOrders(doc: OrderDoc): Promise<boolean> {
  if (!GIST_TOKEN) return false;
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${GIST_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "rairin-ai-web",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: { "bini-orders.json": { content: JSON.stringify(doc) } } }),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
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
  if (!["me", "collection", "order", "order-status", "buy", "salvage", "convert"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 404 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // Direct writes never go through here — use the "order" queue below.
  if (action !== "me" && action !== "collection" && action !== "order" && action !== "order-status") {
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

  // Gallery: viewer's own BINI as [id, name, image], newest first.
  if (action === "collection") {
    const cols = await readCollections();
    if (!cols) {
      return NextResponse.json(
        { ok: false, error: "Gallery not published yet — the bot pushes it with the stats. Try again shortly." },
        { status: 503 }
      );
    }
    const arr = Array.isArray(cols.users?.[uid]) ? cols.users[uid] : [];
    return NextResponse.json({
      ok: true,
      snapshot_at: cols.updated_at || null,
      total: arr.length,
      items: [...arr].reverse(),
    });
  }

  // Order status poll: the bot flips pending -> done/failed.
  if (action === "order-status") {
    const doc = await readOrders();
    const entry = doc?.orders?.[String(body.order_id || "")];
    if (!entry || entry.uid !== uid) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status: entry.status, message: entry.message || "" });
  }

  // One-tap order queue: validated here for instant feedback, executed by
  // the bot poller (re-validated there). uid comes from signed initData —
  // users can only ever order for themselves.
  if (action === "order") {
    if (!GIST_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Shop queue not configured yet (admin: set BINI_GIST_TOKEN on Vercel)." },
        { status: 503 }
      );
    }
    const want = String(body.want || "");
    const snap3 = await fetchSnapshot();
    const row3 = snap3?.users?.[uid];
    if (!row3) {
      return NextResponse.json({ ok: false, error: "No record for thee yet." }, { status: 404 });
    }
    const order: OrderEntry = { id: randomUUID(), uid, action: "", ts: Date.now(), status: "pending" };
    if (want === "buy") {
      const item = (catalog as { items: { id: string; name: string; cost: number }[] }).items.find(
        (i) => i.id === String(body.item_id || "")
      );
      if (!item) return NextResponse.json({ ok: false, error: "Unknown item." }, { status: 400 });
      if ((row3.mana ?? 0) < item.cost) {
        return NextResponse.json(
          { ok: false, error: `Need ${item.cost} MANA, thou hast ${row3.mana ?? 0}.` },
          { status: 400 }
        );
      }
      order.action = "buy";
      order.item_id = item.id;
    } else if (want === "salvage") {
      const bid = String(body.bini_id || "");
      const cols = await readCollections();
      const arr = Array.isArray(cols?.users?.[uid]) ? (cols as { users: Record<string, [number, string, string][]> }).users[uid] : [];
      if (!arr.some((e) => String(e[0]) === bid)) {
        return NextResponse.json({ ok: false, error: `BINI #${bid} is not in thy vault.` }, { status: 404 });
      }
      if (row3.favorite_id != null && String(row3.favorite_id) === bid) {
        return NextResponse.json({ ok: false, error: "That BINI is thy favorite — change it in /mybini first." }, { status: 400 });
      }
      order.action = "salvage";
      order.bini_id = bid;
    } else if (want === "convert") {
      const pts = parseInt(String(body.points ?? ""), 10);
      const min = (catalog as { minConvert?: number }).minConvert || 5;
      if (!Number.isFinite(pts) || pts < min) {
        return NextResponse.json({ ok: false, error: `Minimum convert is ${min} rank pts.` }, { status: 400 });
      }
      if ((row3.rank_points ?? 0) < pts) {
        return NextResponse.json({ ok: false, error: `Thou hast only ${row3.rank_points ?? 0} rank pts.` }, { status: 400 });
      }
      order.action = "convert";
      order.points = pts;
    } else {
      return NextResponse.json({ ok: false, error: "Unknown order." }, { status: 400 });
    }
    const doc = (await readOrders()) || { updated_at: null, orders: {} };
    doc.orders[order.id] = order;
    doc.updated_at = new Date().toISOString();
    if (!(await writeOrders(doc))) {
      return NextResponse.json({ ok: false, error: "Could not queue order. Try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, order_id: order.id });
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
      {
        ok: false,
        error: "No record for thee yet — use /getbini in the bot first, then refresh.",
        uid,
        published: Object.keys(snap.users || {}).length,
        snapshot_at: snap.updated_at,
      },
      { status: 404 }
    );
  }
  return NextResponse.json({
    ok: true,
    snapshot_at: snap.updated_at,
    build: (snap as { build?: string }).build || null,
    user: {
      id: uid,
      name: row.name,
      handle: row.handle ? `@${String(row.handle).replace(/^@/, "")}` : "",
      mana: row.mana,
      rank_points: row.rank_points,
      rank_letter: row.rank_letter,
      favorite_id: row.favorite_id ?? null,
      buffs: row.buffs,
      collection: row.collection,
      stats: row.stats,
    },
  });
}
