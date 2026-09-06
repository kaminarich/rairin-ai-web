/**
 * Licensed-device count shown in the hero.
 *
 * The figure is the deduplicated set of registered device serials, minus revoked
 * ones - the same resolution order the verification server uses. Registration is
 * permanent, so it only moves when a serial is added or revoked.
 *
 * Two sources, in order:
 *
 *   1. RAIRIN_STATS_URL (+ optional RAIRIN_STATS_TOKEN) - a JSON endpoint that
 *      returns { active } or { unique }. Re-read every REVALIDATE_SECONDS, so the
 *      page tracks the server without a redeploy.
 *   2. src/data/license-stats.json - the snapshot refreshed by the scheduled
 *      GitHub Actions workflow over SSH. Used when no endpoint is configured or
 *      the endpoint is unreachable.
 *
 * If neither yields a number the hero falls back to the device-profile count, so
 * the site never renders an empty or invented figure. No host, port or credential
 * is committed: those live in GitHub Actions secrets and Vercel env vars.
 */

import snapshot from "@/data/license-stats.json";

export type LicenseStats = {
  activeDevices: number | null;
  updatedAt: string | null;
  live: boolean;
};

const REVALIDATE_SECONDS = 300;

function toCount(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseInt(value.trim(), 10) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

function fromSnapshot(): LicenseStats {
  const active = toCount(snapshot?.active);
  const registered = toCount(snapshot?.registered);
  const usable = snapshot?.source !== "placeholder" && registered !== null && registered > 0;

  return {
    activeDevices: usable ? active : null,
    updatedAt: typeof snapshot?.updatedAt === "string" ? snapshot.updatedAt : null,
    live: false,
  };
}

async function fromEndpoint(): Promise<LicenseStats | null> {
  const url = process.env.RAIRIN_STATS_URL?.trim();
  if (!url) return null;

  const token = process.env.RAIRIN_STATS_TOKEN?.trim();

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null) return null;

    const record = payload as Record<string, unknown>;
    const active = toCount(record.active) ?? toCount(record.unique) ?? toCount(record.activeDevices);
    if (active === null) return null;

    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : null;
    return { activeDevices: active, updatedAt, live: true };
  } catch {
    return null;
  }
}

export async function getLicenseStats(): Promise<LicenseStats> {
  const live = await fromEndpoint();
  if (live) return live;

  const staticOverride = toCount(process.env.RAIRIN_ACTIVE_DEVICES);
  if (staticOverride !== null) {
    return {
      activeDevices: staticOverride,
      updatedAt: process.env.RAIRIN_STATS_UPDATED_AT?.trim() || null,
      live: false,
    };
  }

  return fromSnapshot();
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
