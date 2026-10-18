import { NextResponse } from "next/server";
import {
  getOverviewAnalytics,
  parseAnalyticsRange,
} from "@/lib/analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseAnalyticsRange(searchParams.get("range"));

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const analytics = await getOverviewAnalytics(parsed.range);
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json(
      { error: "Could not load analytics" },
      { status: 500 },
    );
  }
}
