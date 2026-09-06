/**
 * Licensed-device count shown in the hero.
 *
 * Source of truth is the deduplicated licence total reported by Rairin Manager:
 * every registered device serial, counted once. Registration is permanent, so
 * the figure only moves when a serial is added or revoked.
 *
 * No infrastructure details are committed here. Configure it with Vercel project
 * environment variables (Settings → Environment Variables), or GitHub Actions
 * secrets if a workflow ever writes them:
 *
 *   RAIRIN_ACTIVE_DEVICES   plain integer, used as-is
 *   RAIRIN_STATS_UPDATED_AT ISO date shown next to the figure
 *   RAIRIN_STATS_URL        optional JSON endpoint returning { unique } or { activeDevices }
 *   RAIRIN_STATS_TOKEN      optional bearer token for that endpoint
 *
 * If none are set the hero falls back to the device-profile count, so the site
 * never renders an empty or invented figure.
 */

export type LicenseStats = {
  activeDevices: number | null;
  updatedAt: string | null;
};

const REVALIDATE_SECONDS = 900;

function toCount(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseInt(value.trim(), 10) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

async function fetchRemoteCount(): Promise<number | null> {
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
    return toCount(record.unique) ?? toCount(record.activeDevices);
  } catch {
    return null;
  }
}

export async function getLicenseStats(): Promise<LicenseStats> {
  const activeDevices = (await fetchRemoteCount()) ?? toCount(process.env.RAIRIN_ACTIVE_DEVICES);

  return {
    activeDevices,
    updatedAt: process.env.RAIRIN_STATS_UPDATED_AT?.trim() || null,
  };
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
