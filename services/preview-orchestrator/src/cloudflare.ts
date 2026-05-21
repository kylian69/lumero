import { config } from "./config";

/**
 * Optional per-preview DNS automation.
 *
 * On the free Cloudflare plan, Universal SSL only covers one level of subdomain
 * (`*.lumero.fr`). Preview hostnames are therefore minted one level under the
 * apex (e.g. `slug-id6-preview-dev.lumero.fr`). The staging tunnel can't claim
 * the `*.lumero.fr` wildcard (production owns it), so instead we create an
 * explicit proxied CNAME per preview pointing at the staging tunnel. An explicit
 * record overrides the production wildcard, and being one level deep it is
 * covered by the free Universal SSL cert.
 *
 * Disabled (no-op) unless CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID and
 * CLOUDFLARE_TUNNEL_ID are all set — production keeps using its wildcard and
 * never calls this.
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

function dnsEnabled(): boolean {
  return Boolean(
    config.CLOUDFLARE_API_TOKEN &&
      config.CLOUDFLARE_ZONE_ID &&
      config.CLOUDFLARE_TUNNEL_ID
  );
}

function tunnelTarget(): string {
  return `${config.CLOUDFLARE_TUNNEL_ID}.cfargotunnel.com`;
}

async function cf(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    const errs = Array.isArray(body?.errors)
      ? body.errors.map((e: any) => e.message).join("; ")
      : `HTTP ${res.status}`;
    throw new Error(`Cloudflare API error: ${errs}`);
  }
  return body;
}

async function findRecordId(hostname: string): Promise<string | null> {
  const body = await cf(
    `/zones/${config.CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`
  );
  return body.result?.[0]?.id ?? null;
}

/**
 * Idempotently create a proxied CNAME for the preview hostname pointing at the
 * staging tunnel. Safe to call repeatedly. No-op when DNS automation is off.
 */
export async function ensureDnsRecord(hostname: string): Promise<void> {
  if (!dnsEnabled()) return;
  try {
    const existing = await findRecordId(hostname);
    if (existing) return;
    await cf(`/zones/${config.CLOUDFLARE_ZONE_ID}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: hostname,
        content: tunnelTarget(),
        proxied: true,
        comment: "preview-orchestrator (auto)",
      }),
    });
    console.log(`[cloudflare] created DNS record ${hostname} → ${tunnelTarget()}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cloudflare] ensureDnsRecord(${hostname}) failed: ${message}`);
    throw err;
  }
}

/**
 * Delete the preview's CNAME. Best-effort: logs but never throws so teardown
 * always completes. No-op when DNS automation is off.
 */
export async function deleteDnsRecord(hostname: string): Promise<void> {
  if (!dnsEnabled()) return;
  try {
    const id = await findRecordId(hostname);
    if (!id) return;
    await cf(`/zones/${config.CLOUDFLARE_ZONE_ID}/dns_records/${id}`, {
      method: "DELETE",
    });
    console.log(`[cloudflare] deleted DNS record ${hostname}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cloudflare] deleteDnsRecord(${hostname}) failed: ${message}`);
  }
}
