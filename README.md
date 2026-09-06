# RaiRin-AI — Official Site

Marketing and licensing site for **RaiRin-AI**, a Magisk root module that pairs an onboard AI assistant with a game booster engine for Android.

Live: deployed on Vercel from this repository (`main` branch, auto-deploy).

## Stack

- Next.js 16 (App Router) + TypeScript
- Hand-written skeuomorphic CSS design system in `src/app/globals.css`
- No UI libraries

## Design contract

The visual language mirrors the module dashboard itself:

- one light source, straight down
- debossed controls: dark rim above, light rim below, zero elevation
- raised panels: specular top rim, occlusion below, real drop shadow
- pressed states cut deeper, never translate
- accent parts take a coloured floor with a neutral bevel
- panels are opaque

## Content map

`src/app/page.tsx` holds every string: features, supported SoC families, spoof profile samples, license terms, payment methods, and the four-step activation flow.

| Item | Where |
|---|---|
| Banner | `public/banner.png` |
| Dashboard / overlay previews | `public/dashboard-preview.jpg`, `public/overlay-preview.jpg` |
| Payment details | `PAY_ID`, `PAY_INTL` |
| Serial command | `SERIAL_CMD` |
| Contact links | `TELEGRAM`, `PAYPAL`, `TRAKTEER`, `KOFI`, `GITHUB` |
| Active-user figure | `src/lib/licenseStats.ts` (env-driven) |

## Active licensed users

The first hero stat shows the deduplicated count of registered device serials. It is read at build/request time from environment variables — nothing about the license server lives in this repo. See `.env.example` for the keys and set them in Vercel under Settings → Environment Variables, or as GitHub Actions secrets if a workflow ever publishes them:

- `RAIRIN_ACTIVE_DEVICES` — plain integer
- `RAIRIN_STATS_UPDATED_AT` — date shown beside the figure
- `RAIRIN_STATS_URL` — optional JSON endpoint returning `{ "unique": <int> }`, re-read every 15 minutes and preferred over the static count
- `RAIRIN_STATS_TOKEN` — optional bearer token for that endpoint

With none of them set, that tile falls back to the device-profile count, so the page never shows a placeholder or an invented number.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Licensing model

One donation, minimum Rp 10.000 (about USD 1.30), buys a permanent license bound to a single device serial number. Buyers send payment proof plus the output of `su -c getprop ro.serialno` to [t.me/kaminarich](https://t.me/kaminarich) for manual registration.
