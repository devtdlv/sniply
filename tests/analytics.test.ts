import { describe, expect, it } from "vitest";
import {
  eachUtcDay,
  fillDaySeries,
  getRangeBounds,
  parseAnalyticsRange,
  rowsToCountMap,
  startOfUtcDay,
  utcDayKey,
} from "@/lib/analytics";

describe("parseAnalyticsRange", () => {
  it("defaults to 7d and accepts supported values", () => {
    expect(parseAnalyticsRange(undefined)).toEqual({ ok: true, range: "7d" });
    expect(parseAnalyticsRange("30d")).toEqual({ ok: true, range: "30d" });
    expect(parseAnalyticsRange("ALL")).toEqual({ ok: true, range: "all" });
  });

  it("rejects unsupported ranges", () => {
    const result = parseAnalyticsRange("90d");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/range must be/i);
  });
});

describe("UTC day helpers", () => {
  it("normalizes day keys and range windows in UTC", () => {
    const now = new Date("2026-03-15T18:30:00.000Z");
    expect(utcDayKey(now)).toBe("2026-03-15");
    expect(startOfUtcDay(now).toISOString()).toBe("2026-03-15T00:00:00.000Z");

    const seven = getRangeBounds("7d", now);
    expect(seven.from?.toISOString()).toBe("2026-03-09T00:00:00.000Z");
    expect(seven.fixedDays).toHaveLength(7);
    expect(seven.fixedDays?.[0]).toBe("2026-03-09");
    expect(seven.fixedDays?.[6]).toBe("2026-03-15");

    const thirty = getRangeBounds("30d", now);
    expect(thirty.fixedDays).toHaveLength(30);
    expect(thirty.fixedDays?.[0]).toBe("2026-02-14");

    const all = getRangeBounds("all", now);
    expect(all.from).toBeNull();
    expect(all.fixedDays).toBeNull();
  });

  it("fills missing days with zero clicks", () => {
    const days = eachUtcDay(
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-03T00:00:00.000Z"),
    );
    const counts = rowsToCountMap([
      { day: "2026-01-01", count: 2 },
      { day: "2026-01-03", count: 5 },
    ]);

    expect(fillDaySeries(days, counts)).toEqual([
      { date: "2026-01-01", clicks: 2 },
      { date: "2026-01-02", clicks: 0 },
      { date: "2026-01-03", clicks: 5 },
    ]);
  });
});
