import { shortUrlForCode } from "@/lib/app-url";

export { generateQrDataUrl } from "@/lib/qr-encode";
export { generateQrPngBuffer } from "@/lib/qr-png";

export type QrTargetResult =
  | { ok: true; shortUrl: string }
  | { ok: false; error: string };

/**
 * Resolves and validates the short URL that should be encoded in a QR code.
 * Ensures the payload is an absolute http(s) URL for the given code.
 */
export function resolveQrShortUrl(
  code: string,
  options?: { request?: Request; expectedShortUrl?: string },
): QrTargetResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, error: "Short code is required" };
  }

  const shortUrl = shortUrlForCode(trimmed, options?.request);

  let parsed: URL;
  try {
    parsed = new URL(shortUrl);
  } catch {
    return { ok: false, error: "Invalid short URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Short URL must use http or https" };
  }

  if (parsed.pathname !== `/${trimmed}`) {
    return { ok: false, error: "Short URL path does not match code" };
  }

  if (
    options?.expectedShortUrl &&
    options.expectedShortUrl.replace(/\/$/, "") !== shortUrl
  ) {
    return { ok: false, error: "Short URL mismatch" };
  }

  return { ok: true, shortUrl };
}
