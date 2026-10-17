import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export type UrlValidationResult =
  | { ok: true; url: URL; normalized: string }
  | { ok: false; error: string };

export type ResolveAddresses = (hostname: string) => Promise<string[]>;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

/**
 * Destination URL policy (creation-time):
 * - Absolute http/https only
 * - No embedded credentials
 * - Hostname must not be localhost / blocked names
 * - Literal IPs and DNS-resolved addresses must not be loopback,
 *   private, link-local, unique-local, or cloud metadata ranges
 * - Does not fetch the destination or follow redirect chains (avoids SSRF).
 *   Destination-controlled redirects to internal hosts remain an inherent
 *   limitation when the shortener only stores and later redirects browsers.
 */
export async function validateDestinationUrl(
  raw: string,
  options?: { resolveAddresses?: ResolveAddresses },
): Promise<UrlValidationResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Destination URL is required" };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "Destination must be a valid absolute URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed" };
  }

  if (url.username || url.password) {
    return { ok: false, error: "URLs with credentials are not allowed" };
  }

  if (!url.hostname) {
    return { ok: false, error: "Destination must include a hostname" };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    return { ok: false, error: "Local or internal hostnames are not allowed" };
  }

  const literalKind = isIP(hostname);
  if (literalKind !== 0) {
    if (isBlockedIp(hostname)) {
      return {
        ok: false,
        error: "Local or private network addresses are not allowed",
      };
    }
    return { ok: true, url, normalized: url.toString() };
  }

  const resolve = options?.resolveAddresses ?? defaultResolveAddresses;

  let addresses: string[];
  try {
    addresses = await resolve(hostname);
  } catch {
    return { ok: false, error: "Destination hostname could not be resolved" };
  }

  if (addresses.length === 0) {
    return { ok: false, error: "Destination hostname could not be resolved" };
  }

  for (const address of addresses) {
    if (isBlockedIp(address)) {
      return {
        ok: false,
        error: "Destination resolves to a local or private network address",
      };
    }
  }

  return { ok: true, url, normalized: url.toString() };
}

async function defaultResolveAddresses(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

export function isBlockedIp(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) return isBlockedIpv4(address);
  if (kind === 6) return isBlockedIpv6(address);
  return true;
}

function isBlockedIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local + cloud metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  return false;
}

function isBlockedIpv6(address: string): boolean {
  const normalized = normalizeIpv6(address);

  // Unspecified / loopback
  if (normalized === "::" || normalized === "::1") return true;

  // IPv4-mapped IPv6 (:ffff:x.x.x.x)
  const mapped = ipv4MappedAddress(normalized);
  if (mapped) return isBlockedIpv4(mapped);

  // Unique local fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local fe80::/10
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  return false;
}

function normalizeIpv6(address: string): string {
  // Expand for simple prefix checks; Node's isIP already validated form.
  const lower = address.toLowerCase();
  if (lower.includes(".")) {
    // Keep mapped form handling separate.
    return lower;
  }
  return lower;
}

function ipv4MappedAddress(address: string): string | null {
  const lower = address.toLowerCase();
  const marker = "::ffff:";
  const index = lower.lastIndexOf(marker);
  if (index === -1) return null;

  const suffix = lower.slice(index + marker.length);
  if (isIP(suffix) === 4) return suffix;

  // Hex form ::ffff:7f00:1
  const hextets = suffix.split(":");
  if (hextets.length !== 2) return null;
  const hi = Number.parseInt(hextets[0], 16);
  const lo = Number.parseInt(hextets[1], 16);
  if (Number.isNaN(hi) || Number.isNaN(lo)) return null;

  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}
