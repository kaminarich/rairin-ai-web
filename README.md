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

The first hero stat shows the deduplicated count of registered device serials, minus revoked ones. Nothing about the VPS lives in this repo.

Resolution order in `src/lib/licenseStats.ts`:

1. `RAIRIN_STATS_URL` (+ optional `RAIRIN_STATS_TOKEN`) — JSON endpoint returning `{ "active": <int> }`, re-read every 5 minutes, no redeploy needed
2. `RAIRIN_ACTIVE_DEVICES` — manual integer override
3. `src/data/license-stats.json` — snapshot refreshed over SSH by `.github/workflows/license-stats.yml`

With none of them usable, that tile falls back to the device-profile count, so the page never shows a placeholder or an invented number.

### Scheduled refresh over SSH

`.github/workflows/license-stats.yml` runs every 3 hours (and on demand via *Actions → Refresh licence stats → Run workflow*). It calls `scripts/fetch_license_stats.py`, which SSHes to the VPS, runs the counter, and rewrites the snapshot. Vercel redeploys on the resulting commit.

Repository secrets — *Settings → Secrets and variables → Actions*:

| Secret | Required | Purpose |
|---|---|---|
| `VPS_HOST` | yes | IP or hostname |
| `VPS_USER` | yes | SSH user |
| `VPS_HOST_KEY` | yes | `known_hosts` line, pins the server identity |
| `VPS_SSH_KEY` | preferred | private key contents |
| `VPS_PASSWORD` | fallback | used only when no key is set |
| `VPS_PORT` | no | defaults to 22 |
| `VPS_SSH_KEY_PASSPHRASE` | no | if the key is encrypted |
| `RAIRIN_STATS_COMMAND` | no | defaults to `/usr/local/bin/rairin-license-count` |
| `RAIRIN_REMOTE_DIR` | no | data dir for the inline fallback, defaults to `~/rairin` |

Get the host key line once:

```bash
pip install paramiko
VPS_HOST=... VPS_PORT=... VPS_USER=... VPS_PASSWORD=... \
  python3 scripts/fetch_license_stats.py --print-host-key
```

### VPS-side counter

`scripts/vps/rairin-license-count` reports counts only — no serials, paths, or credentials. Install it on the server so the SSH key can be locked to it:

```bash
sudo install -m 0755 rairin-license-count /usr/local/bin/rairin-license-count
RAIRIN_DIR=$HOME/rairin /usr/local/bin/rairin-license-count
```

Then restrict the deploy key in `~/.ssh/authorized_keys`:

```
command="/usr/local/bin/rairin-license-count",restrict <key type> <key> license-stats
```

That key can then do nothing but print the counts, even if the token leaks. If the counter is not installed, the script falls back to an inline read-only snippet over `python3 -`, which needs an unrestricted key.

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
