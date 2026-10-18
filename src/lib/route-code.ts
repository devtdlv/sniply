import { isReservedCode, isValidLinkCodeParam } from "@/lib/codes";

/** Returns a trimmed code when safe to look up; otherwise null. */
export function parseRouteCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!isValidLinkCodeParam(trimmed) || isReservedCode(trimmed)) {
    return null;
  }
  return trimmed;
}
