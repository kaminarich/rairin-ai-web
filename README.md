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
| Payment details | `PAY_ID`, `PAY_INTL` |
| Serial command | `SERIAL_CMD` |
| Contact links | `TELEGRAM`, `PAYPAL`, `TRAKTEER`, `KOFI`, `GITHUB` |

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
