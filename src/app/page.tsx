import Image from "next/image";
import type { ReactNode } from "react";
import CopyButton from "@/components/CopyButton";
import ScrollReveal from "@/components/ScrollReveal";

const TELEGRAM = "https://t.me/kaminarich";
const PAYPAL = "https://paypal.me/kaminarich";
const TRAKTEER = "https://trakteer.id/kaminarich";
const KOFI = "https://ko-fi.com/kaminarich_here";
const GITHUB = "https://github.com/kaminarich";
const SERIAL_CMD = "su -c getprop ro.serialno";

const icons: Record<string, ReactNode> = {
  ai: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" fill="currentColor" />
      <path d="M18.4 14.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor" />
      <path d="M5 15.6l.6 1.6 1.6.6-1.6.6L5 20l-.6-1.6L2.8 17.8l1.6-.6L5 15.6z" fill="currentColor" />
    </svg>
  ),
  boost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M4.5 14.5a7.5 7.5 0 1 1 15 0" />
      <path d="M12 14.5l3.6-3.6" />
      <path d="M2.7 14.5h1.6M19.7 14.5h1.6M12 6.9V5.3" />
      <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  spoof: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <rect x="6.5" y="2.6" width="11" height="18.8" rx="2.6" />
      <path d="M10.2 18.6h3.6" />
      <path d="M12 7.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z" fill="currentColor" stroke="none" />
    </svg>
  ),
  soc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2.2" />
      <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
      <rect x="10.6" y="10.6" width="2.8" height="2.8" rx="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  overlay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.4l8.4 4.7L12 12.8 3.6 8.1 12 3.4z" />
      <path d="M3.6 12.3l8.4 4.7 8.4-4.7" />
      <path d="M3.6 16.5l8.4 4.7 8.4-4.7" />
    </svg>
  ),
  root: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.6" y="4.6" width="18.8" height="14.8" rx="2.6" />
      <path d="M6.6 9.2l3 3-3 3" />
      <path d="M12.6 15.2h5" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.4 9.6L12 4.2l8.6 5.4" />
      <path d="M5.6 9.6V18M10 9.6V18M14 9.6V18M18.4 9.6V18" />
      <path d="M3.4 20.4h17.2" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.8" y="6.2" width="18.4" height="13" rx="2.6" />
      <path d="M2.8 10h18.4" />
      <path d="M16.4 14.8h2.4" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.4 20V4.6h4.8a4 4 0 0 1 0 8H9.6" />
      <path d="M11.8 20l1-4.4" />
    </svg>
  ),
  binance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8L21.2 12 12 21.2 2.8 12 12 2.8z" />
      <path d="M8.6 12L12 8.5l3.4 3.5L12 15.5 8.6 12z" fill="currentColor" stroke="none" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.6" y="9.4" width="16.8" height="10.8" rx="2.2" />
      <path d="M12 9.4V20.2M3.6 13.6h16.8" />
      <path d="M12 9.4S12 4 8.6 4a2.3 2.3 0 0 0 0 5.4M12 9.4S12 4 15.4 4a2.3 2.3 0 0 1 0 5.4" />
    </svg>
  ),
  coffee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.8 8.4h13v5.8a5.2 5.2 0 0 1-5.2 5.2H9a5.2 5.2 0 0 1-5.2-5.2V8.4z" />
      <path d="M16.8 9.6h1.6a2.7 2.7 0 0 1 0 5.4h-1.6" />
      <path d="M10.4 13.2s-2.3-1.4-2.3-2.9a1.25 1.25 0 0 1 2.3-.6 1.25 1.25 0 0 1 2.3.6c0 1.5-2.3 2.9-2.3 2.9z" fill="currentColor" stroke="none" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 2.4L11.2 13.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M22 2.4l-7 19-4.2-8.8-8.8-4.2 20-6z" fill="currentColor" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4v9.2" />
      <path d="M9.6 9.7c0-1 1.1-1.7 2.4-1.7s2.4.7 2.4 1.7-1.1 1.6-2.4 1.9-2.4.9-2.4 1.9 1.1 1.7 2.4 1.7 2.4-.7 2.4-1.7" />
    </svg>
  ),
  serial: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.6" y="5" width="18.8" height="14" rx="2.6" />
      <circle cx="8.6" cy="11" r="2" />
      <path d="M5.8 16.4c.7-1.6 1.9-2.3 2.8-2.3s2.1.7 2.8 2.3" />
      <path d="M14 9.6h5M14 13.2h5" />
    </svg>
  ),
  proof: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.6" y="6.6" width="18.8" height="12.8" rx="2.6" />
      <path d="M8 6.6l1.5-2.6h5L16 6.6" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.6l5 5 10-11" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M19 13.6v5.9A1.5 1.5 0 0 1 17.5 21h-13A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5h5.9" />
    </svg>
  ),
};

const FEATURES: { key: string; title: string; text: string; seg?: boolean }[] = [
  {
    key: "ai",
    title: "Ask RaiRin — Onboard AI",
    text: "An AI assistant lives inside the booster dashboard. Ask it about your device, adjust the booster through plain conversation, and keep the whole exchange on your own keys.",
  },
  {
    key: "boost",
    title: "Game Booster Engine",
    text: "Four switchable profiles drive CPU behaviour through root-level scripts, applied per game. Switch mid-match from the overlay and the panel breathes one pulse of colour to confirm.",
    seg: true,
  },
  {
    key: "spoof",
    title: "Device Profile Spoofing",
    text: "Present as one of 40+ flagship profiles, from the OnePlus 15 to the ROG Phone 9 Pro. Full build fingerprint, per-game injection, with optional CPU-level identity to match.",
  },
  {
    key: "soc",
    title: "SoC-Aware Tuning",
    text: "Snapdragon, MediaTek, Unisoc, Exynos and Tensor. Every profile carries matching SoC model and hardware strings, and tuning follows the silicon actually running the game.",
  },
  {
    key: "overlay",
    title: "In-Game Overlay",
    text: "A floating dashboard with live FPS readouts, gauges and quick controls, layered over any game. Touches pass straight through when you only want the numbers.",
  },
  {
    key: "root",
    title: "Root-Native Depth",
    text: "Installed as a real Magisk module under /data/adb, not a sandboxed app. Screen recorder, battery tweaks, colour boost and render switching ride along with it.",
  },
];

const SOCS = ["Snapdragon", "MediaTek", "Unisoc", "Exynos", "Tensor"];

const PROFILES = [
  "OnePlus 15",
  "OnePlus 13",
  "OnePlus Ace 5 Pro",
  "Galaxy S25 Ultra",
  "Galaxy Z Fold 7",
  "ROG Phone 9 Pro",
  "RedMagic 10 Pro",
  "iQOO 13",
  "Xiaomi 15 Ultra",
  "Xiaomi 17 Pro",
  "POCO F7 Ultra",
  "Redmi K80 Ultra",
  "vivo X200 Pro",
  "OPPO Find X9 Ultra",
  "nubia Z70 Ultra",
  "HONOR Magic7 Pro",
  "Legion Y700",
  "realme GT7 Pro",
];

const EXTRAS = ["Screen recorder", "Battery tweaks", "Colour boost", "Render switching", "Crosshair overlay", "FPS meter"];

const LICENSE_POINTS = [
  "Permanent license — no subscription, no expiry, no renewal",
  "Bound to one device through its hardware serial number",
  "Every booster mode and all 40+ spoof profiles unlocked",
  "Ask RaiRin AI assistant enabled",
  "Module package and install guidance sent on Telegram",
];

type PayMethod = { key: string; name: string; value: string; copy?: boolean; href?: string };

const PAY_ID: PayMethod[] = [
  { key: "bank", name: "Bank — Seabank", value: "901621586195", copy: true },
  { key: "wallet", name: "E-Wallet — GoPay", value: "085117135623", copy: true },
];

const PAY_INTL: PayMethod[] = [
  { key: "paypal", name: "PayPal", value: "@kaminarich", copy: true, href: PAYPAL },
  { key: "binance", name: "Binance ID", value: "859078904", copy: true },
  { key: "gift", name: "Trakteer", value: "trakteer.id/kaminarich", href: TRAKTEER },
  { key: "coffee", name: "Ko-fi", value: "ko-fi.com/kaminarich_here", href: KOFI },
];

export default function Page() {
  return (
    <>
      <ScrollReveal />
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top">
            <span className="led led--live" />
            <span className="brand-mark">
              RAIRIN<em>-AI</em>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#preview">Preview</a>
            <a href="#features">Features</a>
            <a href="#compatibility">Compatibility</a>
            <a href="#license">License</a>
            <a href="#how-to-buy">How to Buy</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="btn btn--accent btn--sm" href="#license">
            GET LICENSED
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="shell">
            <div className="hero-copy">
              <p className="kicker" data-reveal>
                <span className="led led--live" />
                Magisk module · root · Android
              </p>
              <h1 data-reveal data-delay="1">
                RaiRin<span className="ai">-AI</span>
              </h1>
              <p className="lede" data-reveal data-delay="2">
                A root module that puts an AI assistant and a deep game booster on the same panel. Tune performance per
                game, present your device as flagship hardware, and drive all of it from a floating dashboard that never
                leaves your match.
              </p>
              <div className="cta-row" data-reveal data-delay="3">
                <a className="btn btn--accent" href="#license">
                  Get licensed — Rp 10.000
                  {icons.arrow}
                </a>
                <a className="btn" href="#features">
                  Explore features
                </a>
              </div>
            </div>

            <div className="plate" data-reveal="scale" data-delay="2">
              <Image
                src="/banner.png"
                alt="RaiRin-AI"
                width={1672}
                height={941}
                priority
                sizes="(max-width: 1140px) 100vw, 1140px"
              />
              <span className="sheen" />
            </div>

            <div className="stats">
              <div className="well stat" data-reveal data-delay="1">
                <b>40+</b>
                <span>Device profiles</span>
              </div>
              <div className="well stat" data-reveal data-delay="2">
                <b>5</b>
                <span>SoC families</span>
              </div>
              <div className="well stat" data-reveal data-delay="3">
                <b>4</b>
                <span>Booster modes</span>
              </div>
              <div className="well stat" data-reveal data-delay="4">
                <b>1×</b>
                <span>One-time payment</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="preview">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led" />
                On-device look
              </p>
              <h2 className="title" data-reveal data-delay="1">
                The panel you actually operate
              </h2>
              <p className="lede" data-reveal data-delay="2">
                Two surfaces ship with the module: a landscape dashboard for setup before you play, and a compact R-BOOST
                overlay that rides on top of the game while you do.
              </p>
            </div>

            <div className="shots">
              <div className="shot" data-reveal="left">
                <div className="screen">
                  <Image
                    src="/dashboard-preview.jpg"
                    alt="RaiRin-AI dashboard showing game selection, spoof state, Tweak, Battery and Ask RaiRin controls with live CPU, RAM and temperature readouts"
                    width={1920}
                    height={864}
                    sizes="(max-width: 980px) 100vw, 680px"
                  />
                </div>
                <p className="shot-caption">
                  <span className="led" />
                  Dashboard
                </p>
                <p>
                  Pick a game, arm a spoof profile and set resolution, then launch. The top rail keeps CPU load, RAM,
                  temperature and battery in view, with Tweak, Battery and Ask RaiRin one press away.
                </p>
                <div className="shot-tags">
                  <span className="chip chip--device">Game rail</span>
                  <span className="chip chip--device">Spoof state</span>
                  <span className="chip chip--device">Live telemetry</span>
                  <span className="chip chip--device">Ask RaiRin</span>
                </div>
              </div>

              <div className="shot" data-reveal="right" data-delay="2">
                <div className="screen">
                  <Image
                    src="/overlay-preview.jpg"
                    alt="R-BOOST in-game overlay showing CPU clock and temperature gauges, a 64.0 FPS at 120 Hz readout, and ECO, DEFAULT, BALANCE and R-BOOST mode buttons"
                    width={980}
                    height={1089}
                    sizes="(max-width: 980px) 100vw, 400px"
                  />
                </div>
                <p className="shot-caption">
                  <span className="led led--accent" />
                  R-BOOST overlay
                </p>
                <p>
                  Live FPS against refresh rate, CPU clock and temperature gauges, and all four modes latched in one
                  strip — switchable mid-match without leaving the game.
                </p>
                <div className="shot-tags">
                  <span className="chip chip--device">FPS · Hz</span>
                  <span className="chip chip--device">Mode switch</span>
                  <span className="chip chip--device">Clean · RAM · DND</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led led--accent" />
                What it does
              </p>
              <h2 className="title" data-reveal data-delay="1">
                Built like hardware, not a settings screen
              </h2>
              <p className="lede" data-reveal data-delay="2">
                Every control in RaiRin-AI is machined into a single panel: debossed keys, lit from above, that cut
                deeper when you press them. Underneath sits a root-level engine with real reach into the system.
              </p>
            </div>

            <div className="grid-3">
              {FEATURES.map((f, i) => (
                <article
                  className="panel feature"
                  key={f.key}
                  data-reveal
                  data-delay={String((i % 3) + 1)}
                >
                  <span className="socket">{icons[f.key]}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  {f.seg ? (
                    <div className="seg" aria-hidden="true">
                      <span className="on">R-BOOST</span>
                      <span>BALANCE</span>
                      <span>ECO</span>
                      <span>DEFAULT</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section tray" id="compatibility">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led" />
                Compatibility
              </p>
              <h2 className="title" data-reveal data-delay="1">
                Five silicon families, one module
              </h2>
              <p className="lede" data-reveal data-delay="2">
                RaiRin-AI reads the SoC it is running on and tunes for it. Spoof profiles carry matching SoC model and
                hardware strings, so a spoofed identity stays coherent with what the game sees.
              </p>
            </div>

            <div className="panel screws" data-reveal="scale">
              <div className="chip-row">
                {SOCS.map((soc) => (
                  <span className="chip" key={soc}>
                    <span className="led" />
                    {soc}
                  </span>
                ))}
              </div>

              <div className="divider" style={{ margin: "26px 0" }} />

              <p className="kicker" style={{ marginBottom: 14 }}>
                Sample spoof profiles
              </p>
              <div className="chip-row">
                {PROFILES.map((device) => (
                  <span className="chip chip--device" key={device}>
                    {device}
                  </span>
                ))}
                <span className="chip chip--device">+ more in the module</span>
              </div>

              <div className="divider" style={{ margin: "26px 0" }} />

              <p className="kicker" style={{ marginBottom: 14 }}>
                Also included
              </p>
              <div className="chip-row">
                {EXTRAS.map((extra) => (
                  <span className="chip chip--device" key={extra}>
                    {extra}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="license">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led led--accent" />
                Licensing
              </p>
              <h2 className="title" data-reveal data-delay="1">
                Pay once. Licensed for good.
              </h2>
              <p className="lede" data-reveal data-delay="2">
                A single donation unlocks RaiRin-AI permanently on one device. The license is registered against that
                device serial number, so it survives reinstalls and module updates.
              </p>
            </div>

            <div className="panel screws" data-reveal="scale">
              <div className="license-grid">
                <div data-reveal="left" data-delay="1">
                  <span className="badge">Permanent license</span>
                  <div className="price">
                    <b>Rp 10.000</b>
                    <i>≈ USD 1.30</i>
                  </div>
                  <p className="price-note">Minimum donation · one device · one time</p>

                  <ul className="checks">
                    {LICENSE_POINTS.map((point) => (
                      <li key={point}>
                        {icons.check}
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="cta-row" style={{ justifyContent: "flex-start", marginTop: 0 }}>
                    <a className="btn btn--accent" href="#payment">
                      Choose a payment method
                      {icons.arrow}
                    </a>
                    <a className="btn" href="#how-to-buy">
                      How activation works
                    </a>
                  </div>
                </div>

                <div className="well req" data-reveal="right" data-delay="3">
                  <h4>Before you pay</h4>
                  <ul>
                    <li>
                      <span className="led" />
                      <span>
                        <strong>A rooted Android device.</strong> Magisk or KernelSU, since RaiRin-AI installs as a
                        system module.
                      </span>
                    </li>
                    <li>
                      <span className="led" />
                      <span>
                        <strong>Termux from GitHub.</strong> The GitHub release build, granted root access — needed to
                        read your device serial.
                      </span>
                    </li>
                    <li>
                      <span className="led" />
                      <span>
                        <strong>Telegram.</strong> Payment proof and your serial go to @kaminarich, and activation comes
                        back the same way.
                      </span>
                    </li>
                    <li>
                      <span className="led led--accent" />
                      <span>
                        <strong>One license, one device.</strong> Extra devices need their own donation, each bound to
                        its own serial.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section tray" id="payment">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led" />
                Where to pay
              </p>
              <h2 className="title" data-reveal data-delay="1">
                Payment methods
              </h2>
              <p className="lede" data-reveal data-delay="2">
                Any method below works. Pay the minimum or more, keep the receipt, then send it with your device serial
                number on Telegram.
              </p>
            </div>

            <div className="grid-2">
              <div className="panel pay-group" data-reveal="left">
                <h3>
                  <span className="led" />
                  Indonesia
                </h3>
                <div className="pay-list">
                  {PAY_ID.map((m) => (
                    <div className="well pay-row" key={m.value}>
                      <span className="socket socket--sm socket--dim">{icons[m.key]}</span>
                      <div className="pay-meta">
                        <div className="pay-name">{m.name}</div>
                        <div className="pay-value">{m.value}</div>
                      </div>
                      <div className="pay-actions">
                        <CopyButton value={m.value} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel pay-group" data-reveal="right" data-delay="2">
                <h3>
                  <span className="led led--accent" />
                  International
                </h3>
                <div className="pay-list">
                  {PAY_INTL.map((m) => (
                    <div className="well pay-row" key={m.value}>
                      <span className="socket socket--sm socket--dim">{icons[m.key]}</span>
                      <div className="pay-meta">
                        <div className="pay-name">{m.name}</div>
                        <div className="pay-value">{m.value}</div>
                      </div>
                      <div className="pay-actions">
                        {m.copy ? <CopyButton value={m.value} /> : null}
                        {m.href ? (
                          <a className="btn btn--sm" href={m.href} target="_blank" rel="noreferrer noopener">
                            OPEN
                            {icons.external}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how-to-buy">
          <div className="shell">
            <div className="section-head">
              <p className="kicker" data-reveal>
                <span className="led led--accent" />
                How to get it
              </p>
              <h2 className="title" data-reveal data-delay="1">
                Four steps to an activated device
              </h2>
              <p className="lede" data-reveal data-delay="2">
                Registration is manual and handled personally, so your serial is only ever bound with your own consent.
              </p>
            </div>

            <div className="steps">
              <article className="panel step" data-reveal data-delay="1">
                <span className="step-num">1</span>
                <span className="socket socket--sm socket--dim">{icons.coin}</span>
                <h3>Donate</h3>
                <p>
                  Send at least Rp 10.000, or about USD 1.30, through any method listed above. Keep the transfer receipt
                  open.
                </p>
              </article>

              <article className="panel step" data-reveal data-delay="2">
                <span className="step-num">2</span>
                <span className="socket socket--sm socket--dim">{icons.serial}</span>
                <h3>Read your serial</h3>
                <p>
                  Install Termux from its GitHub release, grant it root access, then run the command below and copy the
                  output.
                </p>
                <div className="well cmd">
                  <code>
                    <span className="prompt">$</span>
                    {SERIAL_CMD}
                  </code>
                  <div className="pay-actions">
                    <CopyButton value={SERIAL_CMD} />
                  </div>
                </div>
              </article>

              <article className="panel step" data-reveal data-delay="3">
                <span className="step-num">3</span>
                <span className="socket socket--sm socket--dim">{icons.proof}</span>
                <h3>Send proof</h3>
                <p>
                  Message @kaminarich on Telegram with a screenshot of your payment and the serial number from step two.
                </p>
                <a className="btn btn--sm" href={TELEGRAM} target="_blank" rel="noreferrer noopener">
                  {icons.telegram}
                  T.ME/KAMINARICH
                </a>
              </article>

              <article className="panel step" data-reveal data-delay="4">
                <span className="step-num">4</span>
                <span className="socket socket--sm socket--dim">{icons.check}</span>
                <h3>Get activated</h3>
                <p>
                  Your serial is registered against a permanent license, and the module package plus install steps come
                  straight back to you.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="shell">
            <div className="panel screws contact-panel" data-reveal="scale">
              <p className="kicker">
                <span className="led led--live" />
                Contact
              </p>
              <h2 className="title">Talk to the developer directly</h2>
              <p className="lede">
                Licensing, activation, install help and module updates all run through Telegram. Send your payment proof
                and device serial number, and your license gets registered by hand.
              </p>
              <div className="cta-row">
                <a className="btn btn--accent" href={TELEGRAM} target="_blank" rel="noreferrer noopener">
                  {icons.telegram}
                  Message on Telegram
                </a>
                <a className="btn" href={GITHUB} target="_blank" rel="noreferrer noopener">
                  GitHub
                  {icons.external}
                </a>
              </div>
              <div className="well pay-row" style={{ maxWidth: 420, margin: "26px auto 0" }}>
                <span className="socket socket--sm socket--dim">{icons.telegram}</span>
                <div className="pay-meta" style={{ textAlign: "left" }}>
                  <div className="pay-name">Telegram</div>
                  <div className="pay-value">t.me/kaminarich</div>
                </div>
                <div className="pay-actions">
                  <CopyButton value="t.me/kaminarich" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell">
          <div className="divider" />
          <div className="footer-inner">
            <a className="brand" href="#top">
              <span className="led led--live" />
              <span className="brand-mark">
                RAIRIN<em>-AI</em>
              </span>
            </a>
            <p>
              Not affiliated with Qualcomm, MediaTek, Unisoc, Samsung Electronics or Google. Device and brand names are
              trademarks of their respective owners. Requires a rooted Android device.
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: "0.1em" }}>
              © 2026 KAMINARICH
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
