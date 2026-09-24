"use client";

/* BINI Guild Shop — Telegram Web App page (BotFather WebApp, NOT a native app).
 * Route: /bini. Opened from the bot via /shop (WebAppInfo button) or the
 * BotFather menu button pointing at https://<host>/bini.
 * Landing page (src/app/page.tsx) is untouched.
 * Live data comes from same-origin /api/bini/* which proxies to the bot VPS
 * (BINI_API_URL). Outside Telegram / bot offline → clearly-labeled demo mode.
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

const DEMO_KEY = "bini-demo-wallet-v1";

function defaultDemo(): MeUser {
  return {
    id: "demo",
    name: "Wandering Hunter",
    handle: "",
    mana: 120,
    rank_points: 35,
    rank_letter: "E",
    buffs: { atk_charges: 0, def_charges: 0, shield_charges: 0, summon_tokens: 0 },
    collection: 0,
    stats: {
      battle_wins: 0,
      battle_losses: 0,
      steal_wins: 0,
      steal_fails: 0,
      steal_def_wins: 0,
      steal_def_losses: 0,
    },
  };
}

function loadDemo(): MeUser {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    if (raw) return { ...defaultDemo(), ...(JSON.parse(raw) as Partial<MeUser>) };
  } catch {
    /* ignore */
  }
  return defaultDemo();
}

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

export default function BiniShopPage() {
  const [tab, setTab] = useState<"shop" | "salvage" | "convert">("shop");
  const [catalog, setCatalog] = useState<Catalog>(bundled as unknown as Catalog);
  const [liveCatalog, setLiveCatalog] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);
  const [live, setLive] = useState(false);
  const [initData, setInitData] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [salvageId, setSalvageId] = useState("");
  const [convertPts, setConvertPts] = useState("25");

  // Telegram WebApp bootstrap + data load.
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      // Load Telegram script (BotFather WebApp runtime).
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
      let tgName = "";
      let tgHandle = "";
      let tgPhoto = "";
      try {
        wa?.ready();
        wa?.expand();
        data = wa?.initData || "";
        const u = wa?.initDataUnsafe?.user;
        if (u) {
          tgName = u.first_name || "";
          tgHandle = u.username ? `@${u.username}` : "";
          tgPhoto = u.photo_url || "";
        }
      } catch {
        /* not in Telegram — demo mode */
      }
      if (cancelled) return;
      setInitData(data);

      // Catalog (live if bot reachable, else bundled).
      try {
        const rc = await fetch("/api/bini", { cache: "no-store" });
        const jc = await rc.json();
        if (jc?.ok && jc?.catalog) {
          const c = jc.catalog.items ? jc.catalog : jc.catalog.catalog || bundled;
          const normalized: Catalog = c.items
            ? (c as Catalog)
            : {
                rate: bundled.rate,
                minConvert: bundled.minConvert,
                items: Object.entries(c.items || {}).map(([id, v]) => ({ id, ...(v as object) })) as ShopItem[],
                rarity: bundled.rarity,
              };
          setCatalog(normalized);
          setLiveCatalog(!!jc.live);
        }
      } catch {
        /* bundled fallback */
      }

      // Profile (live via initData, else demo).
      if (data) {
        try {
          const rm = await fetch("/api/bini/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: data }),
          });
          const jm = await rm.json();
          if (jm?.ok && jm?.user) {
            setMe({ ...jm.user, photo_url: tgPhoto || jm.user.photo_url });
            setLive(true);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through to demo */
        }
      }
      const demo = loadDemo();
      if (tgName) demo.name = tgName;
      if (tgHandle) demo.handle = tgHandle;
      if (tgPhoto) demo.photo_url = tgPhoto;
      setMe(demo);
      setLive(false);
      setLoading(false);
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistDemo = useCallback((u: MeUser) => {
    try {
      window.localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const haptic = useCallback((ok: boolean) => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(ok ? "success" : "error");
    } catch {
      /* ignore */
    }
  }, []);

  // --- actions (live first, demo fallback) ---
  const doBuy = useCallback(
    async (itemId: string) => {
      if (!me || busy) return;
      setBusy(itemId);
      setMsg(null);
      if (live && initData) {
        try {
          const r = await fetch("/api/bini/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData, item_id: itemId }),
          });
          const j = await r.json();
          if (j?.ok) {
            setMe((m) => (m ? { ...m, mana: j.mana ?? m.mana, buffs: j.buffs ?? m.buffs } : m));
            setMsg({ ok: true, text: j.message || "Purchased!" });
            haptic(true);
          } else {
            setMsg({ ok: false, text: j.message || j.error || "Purchase failed." });
            haptic(false);
          }
          setBusy(null);
          return;
        } catch {
          /* fall through to demo */
        }
      }
      // Demo purchase (local only, same costs).
      const item = catalog.items.find((i) => i.id === itemId);
      if (!item) {
        setMsg({ ok: false, text: "Unknown item." });
        setBusy(null);
        return;
      }
      if (me.mana < item.cost) {
        setMsg({ ok: false, text: `Need ${item.cost} MANA (demo wallet: ${me.mana}).` });
        haptic(false);
        setBusy(null);
        return;
      }
      const b = { ...me.buffs };
      if (itemId === "aegis_shield") b.shield_charges = Math.min(3, (b.shield_charges || 0) + 1);
      else if (itemId === "second_wind") b.summon_tokens = Math.min(3, (b.summon_tokens || 0) + 1);
      else if (itemId === "attack_boost") b.atk_charges = (b.atk_charges || 0) + 10;
      else if (itemId === "defense_boost") b.def_charges = (b.def_charges || 0) + 10;
      else if (itemId === "rank_guard_24h" || itemId === "rank_guard_7d")
        b.rank_guard_until = new Date(Date.now() + (itemId.endsWith("7d") ? 7 : 1) * 86400000).toISOString();
      else if (itemId === "swift_summon") b.swift_until = new Date(Date.now() + 86400000).toISOString();
      else if (itemId === "mana_charm") b.charm_until = new Date(Date.now() + 86400000).toISOString();
      const next = { ...me, mana: me.mana - item.cost, buffs: b };
      setMe(next);
      persistDemo(next);
      setMsg({ ok: true, text: `(Demo) ${item.emoji} ${item.name} activated!` });
      haptic(true);
      setBusy(null);
    },
    [me, live, initData, catalog, busy, haptic, persistDemo]
  );

  const doConvert = useCallback(async () => {
    if (!me || busy) return;
    const pts = parseInt(convertPts, 10);
    setBusy("convert");
    setMsg(null);
    if (live && initData) {
      try {
        const r = await fetch("/api/bini/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, points: pts }),
        });
        const j = await r.json();
        if (j?.ok) {
          setMe((m) =>
            m ? { ...m, mana: j.mana ?? m.mana, rank_points: j.rank_points ?? m.rank_points } : m
          );
          setMsg({ ok: true, text: j.message || "Converted!" });
          haptic(true);
        } else {
          setMsg({ ok: false, text: j.message || j.error || "Convert failed." });
          haptic(false);
        }
        setBusy(null);
        return;
      } catch {
        /* demo fallback */
      }
    }
    const rate = catalog.rate || 5;
    if (!Number.isFinite(pts) || pts < (catalog.minConvert || 5)) {
      setMsg({ ok: false, text: `Minimum convert is ${catalog.minConvert || 5} rank pts.` });
      haptic(false);
      setBusy(null);
      return;
    }
    if (pts > me.rank_points) {
      setMsg({ ok: false, text: `(Demo) You only have ${me.rank_points} rank pts.` });
      haptic(false);
      setBusy(null);
      return;
    }
    const gained = Math.floor(pts / rate);
    if (gained < 1) {
      setMsg({ ok: false, text: `(Demo) ${pts} pts is too little at ${rate}:1.` });
      haptic(false);
      setBusy(null);
      return;
    }
    const spent = gained * rate;
    const next = { ...me, rank_points: me.rank_points - spent, mana: me.mana + gained };
    setMe(next);
    persistDemo(next);
    setMsg({ ok: true, text: `(Demo) Converted ${spent} rank pts → ${gained} MANA.` });
    haptic(true);
    setBusy(null);
  }, [me, live, initData, convertPts, catalog, busy, haptic, persistDemo]);

  const doSalvage = useCallback(async () => {
    if (!me || busy) return;
    const bid = salvageId.trim();
    if (!bid) {
      setMsg({ ok: false, text: "Enter a BINI ID to salvage." });
      return;
    }
    if (!window.confirm(`Burn BINI #${bid} for MANA? This is permanent.`)) return;
    setBusy("salvage");
    setMsg(null);
    if (live && initData) {
      try {
        const r = await fetch("/api/bini/salvage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, bini_id: bid }),
        });
        const j = await r.json();
        if (j?.ok) {
          setMe((m) =>
            m ? { ...m, mana: j.mana ?? m.mana, collection: Math.max(0, m.collection - 1) } : m
          );
          setMsg({ ok: true, text: `Salvaged BINI #${bid} → +${j.gained} MANA 🔮` });
          haptic(true);
        } else {
          setMsg({ ok: false, text: j.error || j.message || "Salvage failed." });
          haptic(false);
        }
        setBusy(null);
        setSalvageId("");
        return;
      } catch {
        /* demo fallback */
      }
    }
    const next = { ...me, mana: me.mana + 20, collection: Math.max(0, me.collection - 1) };
    setMe(next);
    persistDemo(next);
    setMsg({ ok: true, text: `(Demo) Salvaged BINI #${bid} → +20 MANA (common rate).` });
    haptic(true);
    setBusy(null);
    setSalvageId("");
  }, [me, live, initData, salvageId, busy, haptic, persistDemo]);

  const convertPreview = useMemo(() => {
    const pts = parseInt(convertPts, 10);
    const rate = catalog.rate || 5;
    if (!Number.isFinite(pts) || pts <= 0) return "—";
    return `≈ ${Math.floor(pts / rate)} MANA`;
  }, [convertPts, catalog]);

  const guardLeft = me ? buffOn(me.buffs.rank_guard_until) : null;
  const swiftLeft = me ? buffOn(me.buffs.swift_until) : null;
  const charmLeft = me ? buffOn(me.buffs.charm_until) : null;

  return (
    <main className="bini-root">
      <div className="bini-shell">
        <header className="bini-banner">
          <p className="bini-kicker">Rairin · Telegram Web App</p>
          <h1 className="bini-title">⚔ BINI Guild Shop 🛡</h1>
          <p className="bini-sub">Trade rank &amp; relics for MANA. Arm thy hunter for battle.</p>
          <div>
            <span className={`bini-live ${live ? "bini-live--on" : "bini-live--demo"}`}>
              {loading ? "… summoning …" : live ? "● live — connected to bot" : "○ demo — open via /shop in Telegram for live"}
            </span>
          </div>
        </header>

        {/* Profile + stats */}
        <section className="bini-profile" aria-label="Hunter profile">
          <div className="bini-avatar" aria-hidden="true">
            {me?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.photo_url} alt="" />
            ) : (
              <span>{(me?.name || "H").slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="bini-name">{loading ? "…" : me?.name || "Unknown Hunter"}</p>
            {me?.handle ? <p className="bini-handle">{me.handle}</p> : null}
            <span className="bini-rank">
              Rank {me?.rank_letter || "E"} · {me?.rank_points ?? 0} pts · 🔮 {me?.mana ?? 0} MANA · 🎒{" "}
              {me?.collection ?? 0} BINI
            </span>
          </div>
        </section>

        <section className="bini-stats" aria-label="Battle stats">
          <div className="bini-stat">
            <b>
              {me?.stats.battle_wins ?? 0}W-{me?.stats.battle_losses ?? 0}L
            </b>
            <span>⚔ Battles</span>
          </div>
          <div className="bini-stat">
            <b>
              {me?.stats.steal_wins ?? 0}W-{me?.stats.steal_fails ?? 0}L
            </b>
            <span>🥷 Steal atk</span>
          </div>
          <div className="bini-stat">
            <b>
              {me?.stats.steal_def_wins ?? 0}W-{me?.stats.steal_def_losses ?? 0}L
            </b>
            <span>🛡 Steal def</span>
          </div>
          <div className="bini-stat">
            <b>
              {me?.buffs.shield_charges ?? 0}🔰 {me?.buffs.summon_tokens ?? 0}🎟️
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
            ⚔️ Atk charges: <b>{me?.buffs.atk_charges ?? 0}</b> · 🧱 Def charges:{" "}
            <b>{me?.buffs.def_charges ?? 0}</b>
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
              {liveCatalog ? " · live prices" : " · bundled prices"}
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
          {live
            ? "Bound by blood to the bot — every purchase strikes true. Same commands work in chat: /buy /salvage /convert."
            : "Demo coffers — browse freely. Open this page via the bot's /shop button for thy true wallet."}{" "}
          Bot chat: <code>/shop</code> <code>/mana</code> <code>/inventory</code>
        </footer>
      </div>
    </main>
  );
}
