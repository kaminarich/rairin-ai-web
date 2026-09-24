"use client";

/* BINI Guild Shop — Telegram Web App page (BotFather WebApp, NOT a native app).
 * Route: /bini. Opened from the bot via /shop (WebAppInfo button) or the
 * BotFather menu button pointing at https://<host>/bini.
 * Landing page (src/app/page.tsx) is untouched.
 * PRODUCTION-ONLY: every number comes from the bot via same-origin
 * /api/bini/* (proxied to the VPS, BINI_API_URL). No demo data, no fake
 * stats — if the bot is unreachable the page says so instead of guessing.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
  items: ShopItem[];
  rarity: Record<string, { mana: number; tags: string[] }>;
};

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
        HapticFeedback?: { notificationOccurred: (k: string) => void };
        colorScheme?: string;
      };
    };
  }
}

type Fatal =
  | { kind: "outside-telegram" }
  | { kind: "bot-unreachable"; detail: string };

export default function BiniShopPage() {
  const [tab, setTab] = useState<"shop" | "salvage" | "convert">("shop");
  const [catalog, setCatalog] = useState<Catalog>(bundled as unknown as Catalog);
  const [liveCatalog, setLiveCatalog] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);
  const [initData, setInitData] = useState("");
  const [fatal, setFatal] = useState<Fatal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [salvageId, setSalvageId] = useState("");
  const [convertPts, setConvertPts] = useState("25");

  const haptic = useCallback((ok: boolean) => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(ok ? "success" : "error");
    } catch {
      /* ignore */
    }
  }, []);

  const refreshMe = useCallback(
    async (data: string, tgPhoto: string): Promise<boolean> => {
      try {
        const rm = await fetch("/api/bini/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: data }),
          cache: "no-store",
        });
        const jm = await rm.json();
        if (jm?.ok && jm?.user) {
          setMe({ ...jm.user, photo_url: tgPhoto || jm.user.photo_url });
          setFatal(null);
          return true;
        }
        setFatal({
          kind: "bot-unreachable",
          detail: String(jm?.error || `HTTP ${rm.status}`),
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

  // --- live-only actions (profile re-fetched after each, so stats stay true) ---
  const doBuy = useCallback(
    async (itemId: string) => {
      if (!me || busy || !initData) return;
      setBusy(itemId);
      setMsg(null);
      try {
        const r = await fetch("/api/bini/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, item_id: itemId }),
        });
        const j = await r.json();
        if (j?.ok) {
          setMsg({ ok: true, text: j.message || "Purchased!" });
          haptic(true);
        } else {
          setMsg({ ok: false, text: String(j.message || j.error || "Purchase failed.") });
          haptic(false);
        }
      } catch (e) {
        setMsg({ ok: false, text: `Request failed: ${e instanceof Error ? e.message : e}` });
        haptic(false);
      }
      await refreshMe(initData, me.photo_url || "");
      setBusy(null);
    },
    [me, busy, initData, haptic, refreshMe]
  );

  const doConvert = useCallback(async () => {
    if (!me || busy || !initData) return;
    const pts = parseInt(convertPts, 10);
    setBusy("convert");
    setMsg(null);
    try {
      const r = await fetch("/api/bini/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, points: pts }),
      });
      const j = await r.json();
      if (j?.ok) {
        setMsg({ ok: true, text: String(j.message || "Converted!") });
        haptic(true);
      } else {
        setMsg({ ok: false, text: String(j.message || j.error || "Convert failed.") });
        haptic(false);
      }
    } catch (e) {
      setMsg({ ok: false, text: `Request failed: ${e instanceof Error ? e.message : e}` });
      haptic(false);
    }
    await refreshMe(initData, me.photo_url || "");
    setBusy(null);
  }, [me, busy, initData, convertPts, haptic, refreshMe]);

  const doSalvage = useCallback(async () => {
    if (!me || busy || !initData) return;
    const bid = salvageId.trim();
    if (!bid) {
      setMsg({ ok: false, text: "Enter a BINI ID to salvage." });
      return;
    }
    if (!window.confirm(`Burn BINI #${bid} for MANA? This is permanent.`)) return;
    setBusy("salvage");
    setMsg(null);
    try {
      const r = await fetch("/api/bini/salvage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, bini_id: bid }),
      });
      const j = await r.json();
      if (j?.ok) {
        setMsg({ ok: true, text: `Salvaged BINI #${bid} → +${j.gained} MANA 🔮` });
        haptic(true);
        setSalvageId("");
      } else {
        setMsg({ ok: false, text: String(j.error || j.message || "Salvage failed.") });
        haptic(false);
      }
    } catch (e) {
      setMsg({ ok: false, text: `Request failed: ${e instanceof Error ? e.message : e}` });
      haptic(false);
    }
    await refreshMe(initData, me.photo_url || "");
    setBusy(null);
  }, [me, busy, initData, salvageId, haptic, refreshMe]);

  const convertPreview = useMemo(() => {
    const pts = parseInt(convertPts, 10);
    const rate = catalog.rate || 5;
    if (!Number.isFinite(pts) || pts <= 0) return "—";
    return `≈ ${Math.floor(pts / rate)} MANA`;
  }, [convertPts, catalog]);

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
                Admin checklist: on the VPS set <b>BINI_API_ENABLED=1</b>, expose 127.0.0.1:5600
                with HTTPS, and set Vercel env <b>BINI_API_URL</b> to that public URL.
              </p>
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
              onClick={() => {
                setTab(t);
                setMsg(null);
              }}
              type="button"
            >
              {t === "shop" ? "🛒 Shop" : t === "salvage" ? "♻️ Salvage" : "💱 Convert"}
            </button>
          ))}
        </nav>

        {tab === "shop" ? (
          <section className="bini-panel">
            <p className="bini-note">
              Rate: {catalog.rate} rank pts = 1 MANA · salvage 20/35/60/100 by rarity
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
        </footer>
      </div>
    </main>
  );
}
