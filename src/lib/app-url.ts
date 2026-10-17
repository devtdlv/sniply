/** Public origin for short URLs (no trailing slash). */
export function appOrigin(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function shortUrlForCode(code: string, request?: Request): string {
  return `${appOrigin(request)}/${code}`;
}
