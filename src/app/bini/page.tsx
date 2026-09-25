"use client";

/* BINI Guild Shop — Telegram Web App page (BotFather WebApp, NOT a native app).
 * Route: /bini. Opened from the bot via /shop (WebAppInfo button) or the
 * BotFather menu button pointing at https://<host>/bini.
 * Landing page (src/app/page.tsx) is untouched.
 * PRODUCTION-ONLY: every number comes from the bot via same-origin
 * /api/bini/* (proxied to the VPS, BINI_API_URL). No demo data, no fake
 * stats — if the bot is unreachable the page says so instead of guessing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./bini.css";
import bundled from "@/data/bini-shop.json";

type Buffs = {
  rank_guard_until?: string | null;
  swift_until?: string | null;
  charm_until?: string | null;
  atk_charges?: number;
  def_charges?: number;
  shield_charges?: number;
  summon_tokens?: number;
};

type Stats = {
  battle_wins: number;
  battle_losses: number;
  steal_wins: number;
  steal_fails: number;
  steal_def_wins: number;
  steal_def_losses: number;
};

type MeUser = {
  id: string;
  name: string;
  handle: string;
  mana: number;
  rank_points: number;
  rank_letter: string;
  buffs: Buffs;
  collection: number;
  favorite_id?: number | null;
  stats: Stats;
  photo_url?: string;
};

type ShopItem = { id: string; name: string; emoji: string; cost: number; desc: string };
type Catalog = {
  rate: number;
  rateLabel?: string;
  minConvert: number;
  relicMana?: number;
  items: ShopItem[];
  rarity: Record<string, { mana: number; tags: string[] }>;
};

// [id, name, image] — newest first from the API.
type BiniItem = [number, string, string];
const GALLERY_PAGE = 24;
// Must match the bot's BINI_BOT_USERNAME (averify.py) for the chat fallback.
const BOT_USERNAME = "rairin_bot";

function buffOn(until?: string | null): string | null {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        initDataUnsafe?: { user?: { first_name?: string; username?: string; photo_url?: string } };
        sendData?: (data: string) => void;
        openTelegramLink?: (url: string) => void;
        HapticFeedback?: { notificationOccurred: (k: string) => void };
        colorScheme?: string;
      };
    };
  }
}

type Fatal =
  | { kind: "outside-telegram" }
  | { kind: "bot-unreachable"; detail: string; uid?: string; published?: number };

export default function BiniShopPage() {
  const [tab, setTab] = useState<"shop" | "salvage" | "convert">("shop");
  const [catalog, setCatalog] = useState<Catalog>(bundled as unknown as Catalog);
  const [liveCatalog, setLiveCatalog] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);
  const [initData, setInitData] = useState("");
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [build, setBuild] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copyCmd, setCopyCmd] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  // Ticker so the "records Xs ago" line stays honest.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  const [fatal, setFatal] = useState<Fatal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [salvageId, setSalvageId] = useState("");
  const [convertPts, setConvertPts] = useState("25");
  const [biniList, setBiniList] = useState<BiniItem[] | null>(null);
  const [biniLoading, setBiniLoading] = useState(false);
  const [biniQuery, setBiniQuery] = useState("");
  const [biniShown, setBiniShown] = useState(GALLERY_PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const initDataRef = useRef("");
  const photoRef = useRef("");

  const haptic = useCallback((ok: boolean) => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(ok ? "success" : "error");
    } catch {
      /* ignore */
    }
  }, []);

  const refreshMe = useCallback(
    async (data: string, tgPhoto: string, fresh = false): Promise<boolean> => {
      try {
        const rm = await fetch("/api/bini/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: data, fresh }),
          cache: "no-store",
        });
        const jm = await rm.json();
        if (jm?.ok && jm?.user) {
          setMe({ ...jm.user, photo_url: tgPhoto || jm.user.photo_url });
          setSnapshotAt(typeof jm.snapshot_at === "string" ? jm.snapshot_at : null);
          setBuild(typeof jm.build === "string" ? jm.build : null);
          setNowMs(Date.now());
          setFatal(null);
          return true;
        }
        setFatal({
          kind: "bot-unreachable",
          detail: String(jm?.error || `HTTP ${rm.status}`),
          uid: typeof jm?.uid === "string" ? jm.uid : undefined,
          published: typeof jm?.published === "number" ? jm.published : undefined,
        });
        return false;
      } catch (e) {
        setFatal({
          kind: "bot-unreachable",
          detail: e instanceof Error ? e.message : "network error",
        });
        return false;
      }
    },
    []
  );

  // Telegram WebApp bootstrap + live data load. No fallbacks.
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      await new Promise<void>((resolve) => {
        if (window.Telegram?.WebApp) return resolve();
        const s = document.createElement("script");
        s.src = "https://telegram.org/js/telegram-web-app.js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });
      const wa = window.Telegram?.WebApp;
      let data = "";
      let tgPhoto = "";
      try {
        wa?.ready();
        wa?.expand();
        data = wa?.initData || "";
        tgPhoto = wa?.initDataUnsafe?.user?.photo_url || "";
      } catch {
        /* not in Telegram */
      }
      if (cancelled) return;
      if (!data) {
        setFatal({ kind: "outside-telegram" });
        setLoading(false);
        return;
      }
      setInitData(data);
      initDataRef.current = data;
      photoRef.current = tgPhoto;

      // Catalog: bundled values mirror the bot; upgrade to live when possible.
      // Live shape: {rate, min_convert, rarity:{tag:mana}, items:{id:{...}}}
      // Bundled shape: {rate, minConvert, rarity:{tier:{mana,tags}}, items:[...]}
      try {
        const rc = await fetch("/api/bini", { cache: "no-store" });
        const jc = await rc.json();
        const raw = jc?.catalog;
        if (jc?.ok && raw) {
          if (Array.isArray(raw.items)) {
            setCatalog(raw as Catalog);
          } else if (raw.items && typeof raw.items === "object") {
            setCatalog({
              rate: raw.rate ?? (bundled as unknown as Catalog).rate,
              rateLabel: raw.rateLabel,
              minConvert: raw.min_convert ?? raw.minConvert ?? (bundled as unknown as Catalog).minConvert,
              items: Object.entries(raw.items).map(([id, v]) => ({
                id,
                ...(v as Omit<ShopItem, "id">),
              })),
              rarity: (bundled as unknown as Catalog).rarity,
            });
          }
          setLiveCatalog(!!jc.live);
        }
      } catch {
        /* bundled mirror stays */
      }

      if (cancelled) return;
      await refreshMe(data, tgPhoto);
      if (!cancelled) setLoading(false);
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  // MANA math mirrors averify.py salvage_mana_value (tag table + relic + charm).
  // Declared before the order actions so doSalvage can use it optimistically.
  const tagMana = useMemo(() => {
    const m: Record<string, number> = {};
    Object.values(catalog.rarity || {}).forEach((t) =>
      (t.tags || []).forEach((tag) => {
        if (!m[tag.toLowerCase()]) m[tag.toLowerCase()] = t.mana;
      })
    );
    return m;
  }, [catalog]);
  const relicMana = catalog.relicMana || 150;
  const charmBoost = useMemo(() => !!buffOn(me?.buffs.charm_until), [me]);
  const biniValue = useCallback(
    (name: string) => {
      const base = tagMana[(name || "").toLowerCase()] ?? relicMana;
      return charmBoost ? Math.max(1, Math.round(base * 1.25)) : base;
    },
    [tagMana, relicMana, charmBoost]
  );

  // --- one-tap orders: queued in the gist, executed by the bot poller.
  // Same UX for every user on every client. No commands, no sendData.
  const queueOrder = useCallback(
    async (payload: Record<string, unknown>): Promise<string | null> => {
      try {
        const r = await fetch("/api/bini/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: initDataRef.current, ...payload }),
          cache: "no-store",
        });
        const j = await r.json();
        if (j?.ok && typeof j.order_id === "string") return j.order_id as string;
        setMsg({ ok: false, text: String(j?.error || "Order failed.") });
      } catch (e) {
        setMsg({ ok: false, text: `Order failed: ${e instanceof Error ? e.message : e}` });
      }
      return null;
    },
    []
  );

  const pollOrder = useCallback(
    async (orderId: string): Promise<{ status: string; message: string } | null> => {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        try {
          const r = await fetch("/api/bini/order-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: initDataRef.current, order_id: orderId }),
            cache: "no-store",
          });
          const j = await r.json();
          if (j?.ok && (j.status === "done" || j.status === "failed")) {
            return { status: j.status as string, message: String(j.message || "") };
          }
        } catch {
          /* keep polling */
        }
      }
      return null;
    },
    []
  );

  const copyAndOpenChat = useCallback(async () => {
    if (copyCmd) {
      try {
        await navigator.clipboard.writeText(copyCmd);
      } catch {
        /* user copies manually from the field */
      }
    }
    const url = `https://t.me/${BOT_USERNAME}`;
    try {
      const wa = window.Telegram?.WebApp;
      if (wa && typeof wa.openTelegramLink === "function") wa.openTelegramLink(url);
      else window.open(url, "_blank");
    } catch {
      window.open(url, "_blank");
    }
  }, [copyCmd]);

  const copyFallback = useCallback(async () => {
    if (!copyCmd) return;
    try {
      await navigator.clipboard.writeText(copyCmd);
      setMsg({ ok: true, text: `Copied ${copyCmd} — paste it in the bot chat.` });
      haptic(true);
    } catch {
      setMsg({ ok: false, text: `Run this in the bot chat: ${copyCmd}` });
      haptic(false);
    }
  }, [copyCmd, haptic]);

  // After an order: fresh reads, spaced out — converges even if the first
  // read races the bot's push. Pending badge stays until the last one.
  const refreshSettled = useCallback(async () => {
    const p = photoRef.current;
    await refreshMe(initDataRef.current, p, true);
    await new Promise((r) => setTimeout(r, 8000));
    await refreshMe(initDataRef.current, photoRef.current, true);
    await new Promise((r) => setTimeout(r, 12000));
    await refreshMe(initDataRef.current, photoRef.current, true);
  }, [refreshMe]);

  // Gallery loads on demand (event-driven, never in an effect body).
  // Declared before the order actions so doSalvage can reset it.
  const galleryBusy = useRef(false);
  const galleryLoaded = useRef(false);
  const loadGallery = useCallback(async () => {
    if (galleryBusy.current || galleryLoaded.current || !initData) return;
    galleryBusy.current = true;
    setBiniLoading(true);
    try {
      const r = await fetch("/api/bini/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, fresh: true }),
        cache: "no-store",
      });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.items)) {
        setBiniList(j.items as BiniItem[]);
        galleryLoaded.current = true;
      } else {
        setBiniList([]);
      }
    } catch {
      setBiniList([]);
    } finally {
      galleryBusy.current = false;
      setBiniLoading(false);
    }
  }, [initData]);

  const switchTab = useCallback(
    (t: "shop" | "salvage" | "convert") => {
      setTab(t);
      setMsg(null);
      setCopyCmd(null);
      setBiniShown(GALLERY_PAGE);
      if (t === "salvage") void loadGallery();
    },
    [loadGallery]
  );

  const resetGallery = useCallback(() => {
    galleryLoaded.current = false;
    setBiniList(null);
    setBiniLoading(false);
    void loadGallery();
  }, [loadGallery]);

  const manualRefresh = useCallback(async () => {
    if (!initData || busy) return;
    setBusy("refresh");
    setMsg(null);
    await refreshMe(initData, me?.photo_url || "", true);
    galleryLoaded.current = false;
    setBiniList(null);
    if (tab === "salvage") void loadGallery();
    setBusy(null);
  }, [initData, busy, me, refreshMe, tab, loadGallery]);

  // --- live-only actions (profile re-fetched after each, so stats stay true) ---
  const doBuy = useCallback(
    async (itemId: string) => {
      if (busy) return;
      setBusy(itemId);
      setMsg(null);
      setCopyCmd(null);
      const item = catalog.items.find((i) => i.id === itemId);
      const oid = await queueOrder({ want: "buy", item_id: itemId });
      if (!oid) {
        setCopyCmd(`/buy ${itemId}`);
        haptic(false);
        setBusy(null);
        return;
      }
      // Optimistic: exact cost is known, reconcile on refresh.
      if (item) setMe((m) => (m ? { ...m, mana: Math.max(0, m.mana - item.cost) } : m));
      setPending(true);
      setMsg({ ok: true, text: `⏳ Brewing ${item?.emoji || "🛒"} ${item?.name || itemId}… the bot confirms in chat.` });
      const res = await pollOrder(oid);
      if (res) {
        setMsg({ ok: res.status === "done", text: res.message || "Done." });
        haptic(res.status === "done");
      } else {
        setMsg({ ok: true, text: "Still in the queue — check the bot chat, then ↻ refresh. Command below works too 👇" });
        setCopyCmd(`/buy ${itemId}`);
        haptic(true);
      }
      await refreshSettled();
      setPending(false);
      setBusy(null);
    },
    [busy, catalog, haptic, queueOrder, pollOrder, refreshSettled]
  );

  const doConvert = useCallback(async () => {
    if (busy) return;
    const pts = parseInt(convertPts, 10);
    setBusy("convert");
    setMsg(null);
    setCopyCmd(null);
    const oid = await queueOrder({ want: "convert", points: pts });
    if (!oid) {
      setCopyCmd(`/convert ${Number.isFinite(pts) ? pts : ""}`.trim());
      haptic(false);
      setBusy(null);
      return;
    }
    // Optimistic: same math as the bot (floor + cost = gained * rate).
    const rate = catalog.rate || 5;
    const gained = Math.floor(pts / rate);
    const spent = gained * rate;
    if (gained > 0) {
      setMe((m) =>
        m ? { ...m, rank_points: Math.max(0, m.rank_points - spent), mana: m.mana + gained } : m
      );
    }
    setPending(true);
    setMsg({ ok: true, text: "⏳ Tribute queued… the bot confirms in chat." });
    const res = await pollOrder(oid);
    if (res) {
      setMsg({ ok: res.status === "done", text: res.message || "Done." });
      haptic(res.status === "done");
    } else {
      setMsg({ ok: true, text: "Still in the queue — check the bot chat, then ↻ refresh. Command below works too 👇" });
      setCopyCmd(`/convert ${Number.isFinite(pts) ? pts : ""}`.trim());
      haptic(true);
    }
    await refreshSettled();
    setPending(false);
    setBusy(null);
  }, [busy, convertPts, catalog, haptic, queueOrder, pollOrder, refreshSettled]);

  const doSalvage = useCallback(async () => {
    if (busy) return;
    const bid = salvageId.trim();
    if (!bid) {
      setMsg({ ok: false, text: "Enter a BINI ID to salvage." });
      return;
    }
    if (!window.confirm(`Burn BINI #${bid} for MANA? This is permanent.`)) return;
    setBusy("salvage");
    setMsg(null);
    setCopyCmd(null);
    const oid = await queueOrder({ want: "salvage", bini_id: bid });
    if (!oid) {
      setCopyCmd(`/salvage ${bid}`);
      haptic(false);
      setBusy(null);
      return;
    }
    // Optimistic: same rarity math as the bot, reconcile on refresh.
    const picked = (biniList || []).find(([id]) => String(id) === bid);
    if (picked) {
      const val = biniValue(picked[1]);
      setMe((m) =>
        m ? { ...m, mana: m.mana + val, collection: Math.max(0, m.collection - 1) } : m
      );
    }
    setPending(true);
    setMsg({ ok: true, text: `⏳ Burning BINI #${bid}… the bot confirms in chat.` });
    const res = await pollOrder(oid);
    if (res) {
      setMsg({ ok: res.status === "done", text: res.message || "Done." });
      haptic(res.status === "done");
      if (res.status === "done") {
        setSalvageId("");
        resetGallery();
      }
    } else {
      setMsg({ ok: true, text: "Still in the queue — check the bot chat, then ↻ refresh. Command below works too 👇" });
      setCopyCmd(`/salvage ${bid}`);
      haptic(true);
    }
    await refreshSettled();
    setPending(false);
    setBusy(null);
  }, [busy, salvageId, biniList, biniValue, haptic, queueOrder, pollOrder, resetGallery, refreshSettled]);

  const convertPreview = useMemo(() => {
    const pts = parseInt(convertPts, 10);
    const rate = catalog.rate || 5;
    if (!Number.isFinite(pts) || pts <= 0) return "—";
    return `≈ ${Math.floor(pts / rate)} MANA`;
  }, [convertPts, catalog]);

  const biniFiltered = useMemo(() => {
    const q = biniQuery.trim().toLowerCase();
    if (!biniList) return [];
    if (!q) return biniList;
    return biniList.filter(
      ([id, name]) => String(id).includes(q) || (name || "").toLowerCase().includes(q)
    );
  }, [biniList, biniQuery]);

  // Lazy scroll: reveal more cards as the sentinel enters view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || tab !== "salvage") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setBiniShown((n) => Math.min(n + GALLERY_PAGE, biniFiltered.length || n + GALLERY_PAGE));
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tab, biniFiltered.length]);

  const snapshotAge = useMemo(() => {
    if (!snapshotAt || !nowMs) return "";
    const s = Math.max(0, Math.floor((nowMs - new Date(snapshotAt).getTime()) / 1000));
    if (Number.isNaN(s)) return "";
    if (s < 10) return "records just now";
    if (s < 60) return `records ${s}s ago`;
    return `records ${Math.floor(s / 60)}m ago`;
  }, [snapshotAt, nowMs]);

  // --- render: loading / fatal / live ---
  if (loading) {
    return (
      <main className="bini-root">
        <div className="bini-shell">
          <header className="bini-banner">
            <p className="bini-kicker">Rairin · Telegram Web App</p>
            <h1 className="bini-title">⚔ BINI Guild Shop 🛡</h1>
            <p className="bini-sub">… summoning thy record …</p>
          </header>
        </div>
      </main>
    );
  }

  if (fatal || !me) {
    return (
      <main className="bini-root">
        <div className="bini-shell">
          <header className="bini-banner">
            <p className="bini-kicker">Rairin · Telegram Web App</p>
            <h1 className="bini-title">⚔ BINI Guild Shop 🛡</h1>
            <p className="bini-sub">
              {fatal?.kind === "outside-telegram"
                ? "This shop only opens inside Telegram — use the bot's /shop button or its Menu button."
                : `The bot did not answer (${fatal?.kind === "bot-unreachable" ? fatal.detail : "unknown"}). No data is shown rather than wrong data.`}
            </p>
          </header>
          {fatal?.kind === "bot-unreachable" ? (
            <section className="bini-panel" style={{ marginTop: 16 }}>
              <p className="bini-note">
                {fatal.detail.includes("No record for thee")
                  ? "Use /getbini in the bot first, then ↻ try again."
                  : fatal.detail.includes("No records published")
                    ? "The bot publishes records every couple of minutes while running — wait a bit, then ↻ try again. (VPS: BINI_SNAPSHOT_ENABLED=1 in .env + restart.)"
                    : fatal.detail.includes("TELEGRAM_BOT_TOKEN")
                      ? "Server misconfigured — admin: set TELEGRAM_BOT_TOKEN on Vercel and redeploy."
                      : "Check thy connection and ↻ try again."}
              </p>
              {fatal.uid || typeof fatal.published === "number" ? (
                <p className="bini-note">
                  thy id <code>{fatal.uid || "?"}</code> · {fatal.published ?? "?"} records published
                </p>
              ) : null}
              <div className="bini-row">
                <button
                  className="bini-buy"
                  style={{ marginTop: 0 }}
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  ↻ Try again
                </button>
              </div>
            </section>
          ) : null}
          <footer className="bini-foot">
            Bot chat: <code>/shop</code> <code>/mana</code> <code>/inventory</code>
          </footer>
        </div>
      </main>
    );
  }

  const guardLeft = buffOn(me.buffs.rank_guard_until);
  const swiftLeft = buffOn(me.buffs.swift_until);
  const charmLeft = buffOn(me.buffs.charm_until);

  return (
    <main className="bini-root">
      <div className="bini-shell">
        <header className="bini-banner">
          <p className="bini-kicker">Rairin · Telegram Web App</p>
          <h1 className="bini-title">⚔ BINI Guild Shop 🛡</h1>
          <p className="bini-sub">Trade rank &amp; relics for MANA. Arm thy hunter for battle.</p>
          <div>
            <span className="bini-live bini-live--on">● live — thy true wallet &amp; stats</span>
          </div>
          {pending ? (
            <div>
              <span className="bini-live bini-live--demo">⏳ syncing with the bot…</span>
            </div>
          ) : null}
          <div className="bini-row" style={{ justifyContent: "center", alignItems: "center" }}>
            {snapshotAge ? <span className="bini-note">{snapshotAge}</span> : null}
            <button
              className="bini-buy"
              style={{ width: "auto", marginTop: 0, padding: "8px 16px", fontSize: 14 }}
              type="button"
              disabled={busy === "refresh"}
              onClick={manualRefresh}
            >
              {busy === "refresh" ? "… " : "↻ Refresh"}
            </button>
          </div>
        </header>

        {/* Profile + stats — all values direct from the bot */}
        <section className="bini-profile" aria-label="Hunter profile">
          <div className="bini-avatar" aria-hidden="true">
            {me.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photo_url} alt="" />
            ) : (
              <span>{(me.name || "H").slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="bini-name">{me.name || "Unknown Hunter"}</p>
            {me.handle ? <p className="bini-handle">{me.handle}</p> : null}
            <span className="bini-rank">
              Rank {me.rank_letter || "E"} · {me.rank_points ?? 0} pts · 🔮 {me.mana ?? 0} MANA · 🎒{" "}
              {me.collection ?? 0} BINI
            </span>
          </div>
        </section>

        <section className="bini-stats" aria-label="Battle stats">
          <div className="bini-stat">
            <b>
              {me.stats.battle_wins ?? 0}W-{me.stats.battle_losses ?? 0}L
            </b>
            <span>⚔ Battles</span>
          </div>
          <div className="bini-stat">
            <b>
              {me.stats.steal_wins ?? 0}W-{me.stats.steal_fails ?? 0}L
            </b>
            <span>🥷 Steal atk</span>
          </div>
          <div className="bini-stat">
            <b>
              {me.stats.steal_def_wins ?? 0}W-{me.stats.steal_def_losses ?? 0}L
            </b>
            <span>🛡 Steal def</span>
          </div>
          <div className="bini-stat">
            <b>
              {me.buffs.shield_charges ?? 0}🔰 {me.buffs.summon_tokens ?? 0}🎟️
            </b>
            <span>Relics held</span>
          </div>
        </section>

        <section className="bini-buffs" aria-label="Active enchantments">
          <p>
            🛡️ Guard: <b>{guardLeft ? `ON (${guardLeft})` : "off"}</b> · ⚡ Swift:{" "}
            <b>{swiftLeft ? `ON (${swiftLeft})` : "off"}</b> · 🌀 Charm:{" "}
            <b>{charmLeft ? `ON (${charmLeft})` : "off"}</b>
          </p>
          <p>
            ⚔️ Atk charges: <b>{me.buffs.atk_charges ?? 0}</b> · 🧱 Def charges:{" "}
            <b>{me.buffs.def_charges ?? 0}</b>
          </p>
        </section>

        {/* Tabs */}
        <nav className="bini-tabs" aria-label="Shop sections">
          {(["shop", "salvage", "convert"] as const).map((t) => (
            <button
              key={t}
              className={`bini-tab ${tab === t ? "bini-tab--active" : ""}`}
              onClick={() => switchTab(t)}
              type="button"
            >
              {t === "shop" ? "🛒 Shop" : t === "salvage" ? "♻️ Salvage" : "💱 Convert"}
            </button>
          ))}
        </nav>

        {copyCmd ? (
          <div className="bini-row" style={{ marginTop: 10 }}>
            <input className="bini-input" value={copyCmd} readOnly aria-label="Chat command" />
            <button
              className="bini-buy"
              style={{ width: "auto", marginTop: 0 }}
              type="button"
              onClick={copyFallback}
            >
              Copy
            </button>
            <button
              className="bini-buy"
              style={{ width: "auto", marginTop: 0 }}
              type="button"
              onClick={copyAndOpenChat}
            >
              Copy + chat 💬
            </button>
          </div>
        ) : null}

        {tab === "shop" ? (
          <section className="bini-panel">
            <p className="bini-note">
              Rate: {catalog.rate} rank pts = 1 MANA · salvage 20/40/70/110, elders {relicMana}
              {liveCatalog ? " · live prices" : " · mirror prices"}
            </p>
            <div className="bini-grid">
              {catalog.items.map((item) => (
                <article className="bini-card" key={item.id}>
                  <h3>
                    {item.emoji} {item.name}
                  </h3>
                  <p>{item.desc}</p>
                  <span className="bini-price">🔮 {item.cost} MANA</span>
                  <button
                    className="bini-buy"
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => doBuy(item.id)}
                  >
                    {busy === item.id ? "Casting…" : `Buy — ${item.cost} MANA`}
                  </button>
                </article>
              ))}
            </div>
            {msg ? <p className={`bini-msg ${msg.ok ? "bini-msg--ok" : "bini-msg--err"}`}>{msg.text}</p> : null}
          </section>
        ) : null}

        {tab === "salvage" ? (
          <section className="bini-panel">
            <p className="bini-note">
              Burn a BINI for MANA — <b>permanent</b>. Favorites cannot be salvaged. Charm 🌀 gives +25%.
            </p>
            <table className="bini-table" aria-label="Salvage rates">
              <thead>
                <tr>
                  <th>Rarity</th>
                  <th>MANA</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(catalog.rarity || {}).map(([tier, v]) => (
                  <tr key={tier}>
                    <td>{tier}</td>
                    <td>🔮 {v.mana}</td>
                    <td>{v.tags.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bini-row">
              <input
                className="bini-input"
                value={salvageId}
                onChange={(e) => setSalvageId(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="BINI ID, e.g. 42"
                inputMode="numeric"
                aria-label="BINI ID to salvage"
              />
              <button className="bini-buy" style={{ width: "auto", marginTop: 0 }} type="button" disabled={busy === "salvage"} onClick={doSalvage}>
                {busy === "salvage" ? "Burning…" : "♻️ Salvage"}
              </button>
            </div>
            {msg ? <p className={`bini-msg ${msg.ok ? "bini-msg--ok" : "bini-msg--err"}`}>{msg.text}</p> : null}

            <div className="bini-row">
              <input
                className="bini-input"
                value={biniQuery}
                onChange={(e) => setBiniQuery(e.target.value)}
                placeholder="🔎 Search thy BINI by ID or name…"
                aria-label="Search collection"
              />
            </div>
            {biniLoading ? (
              <p className="bini-note">… opening thy vault …</p>
            ) : biniList !== null && biniList.length === 0 ? (
              <p className="bini-note">Thy vault is empty — /getbini first.</p>
            ) : (
              <>
                <p className="bini-note">
                  Tap a relic to load its ID 👇 ({biniFiltered.length} shown
                  {biniList ? ` of ${biniList.length}` : ""})
                </p>
                <div className="bini-minis">
                  {biniFiltered.slice(0, biniShown).map(([id, name, img]) => {
                    const selected = salvageId === String(id);
                    const fav = me?.favorite_id != null && String(me.favorite_id) === String(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`bini-mini${selected ? " bini-mini--sel" : ""}`}
                        onClick={() => {
                          if (fav) {
                            setMsg({ ok: false, text: `⭐ #${id} is thy favorite — change it in /mybini first.` });
                            return;
                          }
                          setSalvageId(String(id));
                          setMsg(null);
                          setCopyCmd(null);
                        }}
                        title={fav ? `#${id} ${name} (favorite — protected)` : `#${id} ${name} → +${biniValue(name)} MANA`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={name} loading="lazy" width={96} height={96} />
                        <b>#{id}{fav ? " ⭐" : ""}</b>
                        <span>{name}</span>
                        <em>{fav ? "protected" : `🔮 +${biniValue(name)}`}</em>
                      </button>
                    );
                  })}
                </div>
                <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
              </>
            )}
          </section>
        ) : null}

        {tab === "convert" ? (
          <section className="bini-panel">
            <p className="bini-note">
              One-way tribute: rank pts → MANA at <b>{catalog.rate}:1</b> (min {catalog.minConvert} pts).
              MANA can never become rank — the guild forbids it.
            </p>
            <div className="bini-row">
              <input
                className="bini-input"
                value={convertPts}
                onChange={(e) => setConvertPts(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Rank points"
                inputMode="numeric"
                aria-label="Rank points to convert"
              />
              <button className="bini-buy" style={{ width: "auto", marginTop: 0 }} type="button" disabled={busy === "convert"} onClick={doConvert}>
                {busy === "convert" ? "Tributing…" : `Convert ${convertPreview}`}
              </button>
            </div>
            {msg ? <p className={`bini-msg ${msg.ok ? "bini-msg--ok" : "bini-msg--err"}`}>{msg.text}</p> : null}
          </section>
        ) : null}

        <footer className="bini-foot">
          Bound by blood to the bot — every number on this page is thy live record. Same commands work in
          chat: <code>/buy</code> <code>/salvage</code> <code>/convert</code> · wallet: <code>/mana</code>{" "}
          <code>/inventory</code>
          {build ? (
            <>
              <br />
              bot sync <code>{build}</code>
              {snapshotAge ? (
                <>
                  {" "}· {snapshotAge}
                </>
              ) : null}
            </>
          ) : null}
        </footer>
      </div>
    </main>
  );
}
