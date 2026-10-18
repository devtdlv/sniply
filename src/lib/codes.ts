import { randomBytes } from "node:crypto";

/** Unambiguous alphabet (no 0/O/1/l/I) to reduce mistyped codes. */
export const CODE_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const GENERATED_CODE_LENGTH = 7;
export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 32;
export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Path segments reserved by the app or Next.js internals. */
export const RESERVED_CODES = new Set([
  "api",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "static",
  "assets",
  "health",
  "links",
]);

export type AliasValidationResult =
  | { ok: true; alias: string }
  | { ok: false; error: string };

/**
 * Cryptographically random short code using rejection sampling so each
 * character is uniformly chosen from CODE_ALPHABET.
 */
export function generateShortCode(length = GENERATED_CODE_LENGTH): string {
  if (length < 1) {
    throw new Error("Code length must be at least 1");
  }

  const alphabetLength = CODE_ALPHABET.length;
  const maxUnbiased = 256 - (256 % alphabetLength);
  let code = "";

  while (code.length < length) {
    const bytes = randomBytes(length - code.length);
    for (const byte of bytes) {
      if (byte >= maxUnbiased) continue;
      code += CODE_ALPHABET[byte % alphabetLength];
      if (code.length === length) break;
    }
  }

  return code;
}

export function normalizeAlias(raw: string): string {
  return raw.trim();
}

export function validateAlias(raw: string): AliasValidationResult {
  const alias = normalizeAlias(raw);

  if (alias.length < ALIAS_MIN_LENGTH || alias.length > ALIAS_MAX_LENGTH) {
    return {
      ok: false,
      error: `Alias must be between ${ALIAS_MIN_LENGTH} and ${ALIAS_MAX_LENGTH} characters`,
    };
  }

  if (!ALIAS_PATTERN.test(alias)) {
    return {
      ok: false,
      error: "Alias may only contain letters, numbers, underscores, and hyphens",
    };
  }

  if (RESERVED_CODES.has(alias.toLowerCase())) {
    return { ok: false, error: "This alias is reserved" };
  }

  return { ok: true, alias };
}

export function isReservedCode(code: string): boolean {
  return RESERVED_CODES.has(code.toLowerCase());
}
