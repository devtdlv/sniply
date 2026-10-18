import { NextResponse } from "next/server";
import {
  getLinkAnalytics,
  parseAnalyticsRange,
} from "@/lib/analytics";
import { shortUrlForCode } from "@/lib/app-url";
import { parseRouteCode } from "@/lib/route-code";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const trimmed = parseRouteCode(code);

  if (!trimmed) {
    return NextResponse.json({ error: "Short link not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseAnalyticsRange(searchParams.get("range"));

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const analytics = await getLinkAnalytics(
      trimmed,
      parsed.range,
      shortUrlForCode(trimmed, request),
    );

    if (!analytics) {
      return NextResponse.json({ error: "Short link not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...analytics,
      link: {
        ...analytics.link,
        createdAt: analytics.link.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load link analytics" },
      { status: 500 },
    );
  }
}
