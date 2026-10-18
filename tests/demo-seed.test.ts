import { describe, expect, it } from "vitest";
import {
  buildDemoSeedPlan,
  DEMO_CLICK_TOTAL,
  DEMO_CODE_PREFIX,
  DEMO_LINK_COUNT,
  DEMO_LINK_CATALOG,
  demoClickId,
  isDemoLinkCode,
  resolveDemoLinkAction,
  summarizeDemoPlan,
} from "@/lib/demo-seed";

describe("demo seed plan", () => {
  it("builds a deterministic catalog of 30 demo links and 1200 clicks", () => {
    const a = buildDemoSeedPlan(new Date("2026-10-18T00:00:00.000Z"));
    const b = buildDemoSeedPlan(new Date("2026-10-18T00:00:00.000Z"));
    const summary = summarizeDemoPlan(a);

    expect(summary.linkCount).toBe(DEMO_LINK_COUNT);
    expect(summary.clickCount).toBe(DEMO_CLICK_TOTAL);
    expect(DEMO_LINK_CATALOG).toHaveLength(DEMO_LINK_COUNT);
    expect(summary.zeroClickLinks).toBeGreaterThan(0);
    expect(a).toEqual(b);
    expect(summary.codes.every((code) => code.startsWith(DEMO_CODE_PREFIX))).toBe(
      true,
    );
    expect(
      a.links.every((link) => link.destination.startsWith("https://")),
    ).toBe(true);
  });

  it("uses stable demo click ids for idempotent inserts", () => {
    const plan = buildDemoSeedPlan();
    const ids = new Set(plan.clicks.map((click) => click.id));
    expect(ids.size).toBe(plan.clicks.length);

    const byCode = new Map<string, number>();
    for (const click of plan.clicks) {
      const nextIndex = byCode.get(click.code) ?? 0;
      expect(click.id).toBe(demoClickId(click.code, nextIndex));
      byCode.set(click.code, nextIndex + 1);
    }

    expect(isDemoLinkCode("demo-react-docs")).toBe(true);
    expect(isDemoLinkCode("react-docs")).toBe(false);
  });

  it("spreads clicks across many days for chart variation", () => {
    const now = new Date("2026-10-18T12:00:00.000Z");
    const plan = buildDemoSeedPlan(now);
    const dayKeys = new Set(
      plan.clicks.map((click) => {
        const date = new Date(now.getTime() - click.createdMsAgo);
        return date.toISOString().slice(0, 10);
      }),
    );
    expect(dayKeys.size).toBeGreaterThan(20);
  });
});

describe("resolveDemoLinkAction", () => {
  const planned = {
    code: "demo-react-docs",
    destination: "https://react.dev/learn",
  };

  it("creates when the code is free", () => {
    expect(resolveDemoLinkAction({ planned, existing: null })).toEqual({
      action: "create",
    });
  });

  it("reuses an identical demo link for idempotent runs", () => {
    expect(
      resolveDemoLinkAction({
        planned,
        existing: {
          id: "link_1",
          code: "demo-react-docs",
          destination: "https://react.dev/learn",
        },
      }),
    ).toEqual({ action: "reuse", linkId: "link_1" });
  });

  it("skips when a demo code exists with a different destination", () => {
    expect(
      resolveDemoLinkAction({
        planned,
        existing: {
          id: "link_2",
          code: "demo-react-docs",
          destination: "https://example.com/hijacked",
        },
      }),
    ).toEqual({ action: "skip", reason: "destination_mismatch" });
  });

  it("skips non-demo collisions without overwriting", () => {
    expect(
      resolveDemoLinkAction({
        planned: {
          code: "demo-custom",
          destination: "https://example.com",
        },
        existing: {
          id: "link_3",
          code: "user-owned",
          destination: "https://example.com",
        },
      }),
    ).toEqual({ action: "skip", reason: "code_collision" });
  });
});
