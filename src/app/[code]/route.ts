import { NextResponse } from "next/server";
import { recordClick, resolveLink } from "@/lib/links";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const resolved = await resolveLink(code);

  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  // Record click before redirect. Failures should not block navigation.
  try {
    await recordClick(resolved.id);
  } catch {
    // Intentionally ignored for redirect availability.
  }

  return NextResponse.redirect(resolved.destination, 302);
}
