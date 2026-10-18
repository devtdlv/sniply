/**
 * Deterministic fictional demo-data plan for local UI testing and screenshots.
 * All demo short codes use the `demo-` prefix and are safe to re-run.
 */

export const DEMO_CODE_PREFIX = "demo-";
export const DEMO_SEED_VERSION = 1;
export const DEMO_RNG_SEED = 0x534e4950; // "SNIP"
export const DEMO_LINK_COUNT = 30;
export const DEMO_CLICK_TOTAL = 1200;
export const DEMO_WINDOW_DAYS = 30;

export type DemoLinkSpec = {
  code: string;
  destination: string;
  /** Days before "now" when the link was created (within the demo window). */
  createdDaysAgo: number;
  /** Relative traffic weight; 0 means intentionally zero clicks. */
  trafficWeight: number;
};

export type DemoClickSpec = {
  id: string;
  code: string;
  /** Milliseconds before "now". */
  createdMsAgo: number;
};

export type DemoSeedPlan = {
  version: number;
  links: DemoLinkSpec[];
  clicks: DemoClickSpec[];
};

/** Mulberry32 — small deterministic PRNG. */
export function createDemoRng(seed = DEMO_RNG_SEED): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isDemoLinkCode(code: string): boolean {
  return code.startsWith(DEMO_CODE_PREFIX);
}

export function demoClickId(code: string, index: number): string {
  return `demo_clk_v${DEMO_SEED_VERSION}_${code}_${String(index).padStart(4, "0")}`;
}

/**
 * Fixed catalog of 30 fictional demo links.
 * Destinations are public documentation sites; codes are namespaced with `demo-`.
 */
export const DEMO_LINK_CATALOG: readonly {
  code: string;
  destination: string;
}[] = [
  {
    code: "demo-typescript-guide",
    destination: "https://www.typescriptlang.org/docs/",
  },
  {
    code: "demo-react-docs",
    destination: "https://react.dev/learn",
  },
  {
    code: "demo-github-projects",
    destination: "https://github.com/explore",
  },
  {
    code: "demo-mdn-javascript",
    destination: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    code: "demo-nextjs-app-router",
    destination: "https://nextjs.org/docs/app",
  },
  {
    code: "demo-postgres-tutorial",
    destination: "https://www.postgresql.org/docs/current/tutorial.html",
  },
  {
    code: "demo-prisma-orm",
    destination: "https://www.prisma.io/docs",
  },
  {
    code: "demo-tailwind-docs",
    destination: "https://tailwindcss.com/docs",
  },
  {
    code: "demo-nodejs-api",
    destination: "https://nodejs.org/docs/latest/api/",
  },
  {
    code: "demo-wikipedia-http",
    destination: "https://en.wikipedia.org/wiki/HTTP",
  },
  {
    code: "demo-web-vitals",
    destination: "https://web.dev/articles/vitals",
  },
  {
    code: "demo-css-tricks-flex",
    destination: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
  },
  {
    code: "demo-git-handbook",
    destination: "https://git-scm.com/doc",
  },
  {
    code: "demo-rfc-9110",
    destination: "https://www.rfc-editor.org/rfc/rfc9110",
  },
  {
    code: "demo-vitest-guide",
    destination: "https://vitest.dev/guide/",
  },
  {
    code: "demo-eslint-rules",
    destination: "https://eslint.org/docs/latest/rules/",
  },
  {
    code: "demo-caniuse-grid",
    destination: "https://caniuse.com/css-grid",
  },
  {
    code: "demo-owasp-top-ten",
    destination: "https://owasp.org/www-project-top-ten/",
  },
  {
    code: "demo-docker-get-started",
    destination: "https://docs.docker.com/get-started/",
  },
  {
    code: "demo-kubernetes-basics",
    destination: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
  },
  {
    code: "demo-aws-s3-docs",
    destination: "https://docs.aws.amazon.com/s3/",
  },
  {
    code: "demo-azure-functions",
    destination: "https://learn.microsoft.com/en-us/azure/azure-functions/",
  },
  {
    code: "demo-python-tutorial",
    destination: "https://docs.python.org/3/tutorial/",
  },
  {
    code: "demo-rust-book",
    destination: "https://doc.rust-lang.org/book/",
  },
  {
    code: "demo-go-tour",
    destination: "https://go.dev/tour/",
  },
  {
    code: "demo-sqlite-lang",
    destination: "https://www.sqlite.org/lang.html",
  },
  {
    code: "demo-redis-commands",
    destination: "https://redis.io/docs/latest/commands/",
  },
  {
    code: "demo-graphql-learn",
    destination: "https://graphql.org/learn/",
  },
  {
    code: "demo-jest-docs",
    destination: "https://jestjs.io/docs/getting-started",
  },
  {
    code: "demo-playwright-intro",
    destination: "https://playwright.dev/docs/intro",
  },
];

/** Includes popular, medium, low, and zero-traffic links. */
const TRAFFIC_WEIGHTS: readonly number[] = [
  18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1,
  1, 0, 0, 0.5, 0.5, 0,
];

export type DemoLinkResolution =
  | { action: "create" }
  | { action: "reuse"; linkId: string }
  | { action: "skip"; reason: "code_collision" | "destination_mismatch" };

/**
 * Decides whether a planned demo link can be created or safely reused.
 * Never overwrites a different destination on an occupied code.
 */
export function resolveDemoLinkAction(options: {
  planned: Pick<DemoLinkSpec, "code" | "destination">;
  existing: { id: string; code: string; destination: string } | null;
}): DemoLinkResolution {
  const { planned, existing } = options;

  if (!existing) {
    return { action: "create" };
  }

  if (!isDemoLinkCode(existing.code) || existing.code !== planned.code) {
    return { action: "skip", reason: "code_collision" };
  }

  if (existing.destination !== planned.destination) {
    return { action: "skip", reason: "destination_mismatch" };
  }

  return { action: "reuse", linkId: existing.id };
}

function dayTrafficMultiplier(dayIndexFromOldest: number, totalDays: number): number {
  const progress = dayIndexFromOldest / Math.max(totalDays - 1, 1);
  const wave = 0.65 + 0.55 * Math.sin(progress * Math.PI * 2.2);
  const weekdayBoost =
    dayIndexFromOldest % 7 === 0 || dayIndexFromOldest % 7 === 6 ? 0.72 : 1.12;
  return Math.max(0.25, wave * weekdayBoost);
}

export function buildDemoSeedPlan(_now = new Date()): DemoSeedPlan {
  if (DEMO_LINK_CATALOG.length !== DEMO_LINK_COUNT) {
    throw new Error(
      `Demo catalog size ${DEMO_LINK_CATALOG.length} !== DEMO_LINK_COUNT ${DEMO_LINK_COUNT}`,
    );
  }
  if (TRAFFIC_WEIGHTS.length !== DEMO_LINK_COUNT) {
    throw new Error("Traffic weight table must match demo link count");
  }

  const rngAges = createDemoRng(DEMO_RNG_SEED);

  const links: DemoLinkSpec[] = DEMO_LINK_CATALOG.map((entry, index) => ({
    code: entry.code,
    destination: entry.destination,
    createdDaysAgo: Math.min(
      DEMO_WINDOW_DAYS - 1,
      2 + Math.floor(rngAges() * (DEMO_WINDOW_DAYS - 2)),
    ),
    trafficWeight: TRAFFIC_WEIGHTS[index] ?? 0,
  }));

  const weighted = links.filter((link) => link.trafficWeight > 0);
  const totalWeight = weighted.reduce((sum, link) => sum + link.trafficWeight, 0);

  const clicksPerLink = new Map<string, number>();
  for (const link of links) {
    clicksPerLink.set(link.code, 0);
  }

  let assigned = 0;
  for (const link of weighted) {
    const share = Math.floor((DEMO_CLICK_TOTAL * link.trafficWeight) / totalWeight);
    clicksPerLink.set(link.code, share);
    assigned += share;
  }

  let remainder = DEMO_CLICK_TOTAL - assigned;
  const byWeight = [...weighted].sort((a, b) => b.trafficWeight - a.trafficWeight);
  let cursor = 0;
  while (remainder > 0 && byWeight.length > 0) {
    const link = byWeight[cursor % byWeight.length]!;
    clicksPerLink.set(link.code, (clicksPerLink.get(link.code) ?? 0) + 1);
    remainder -= 1;
    cursor += 1;
  }

  const dayMultipliers = Array.from({ length: DEMO_WINDOW_DAYS }, (_, day) =>
    dayTrafficMultiplier(day, DEMO_WINDOW_DAYS),
  );
  const dayWeightSum = dayMultipliers.reduce((sum, value) => sum + value, 0);

  const clicks: DemoClickSpec[] = [];
  const rngTime = createDemoRng(DEMO_RNG_SEED ^ 0x9e3779b9);

  for (const link of links) {
    const count = clicksPerLink.get(link.code) ?? 0;
    if (count === 0) continue;

    const perDay: number[] = Array.from({ length: DEMO_WINDOW_DAYS }, () => 0);
    let placed = 0;
    for (let day = 0; day < DEMO_WINDOW_DAYS; day += 1) {
      const share = Math.floor((count * dayMultipliers[day]!) / dayWeightSum);
      perDay[day] = share;
      placed += share;
    }

    let dayRemainder = count - placed;
    let dayCursor = 0;
    while (dayRemainder > 0) {
      const preferred = dayCursor % DEMO_WINDOW_DAYS;
      perDay[preferred] += 1;
      dayRemainder -= 1;
      dayCursor += 3;
    }

    let index = 0;
    for (let day = 0; day < DEMO_WINDOW_DAYS; day += 1) {
      const dayCount = perDay[day]!;
      for (let n = 0; n < dayCount; n += 1) {
        const dayStartMsAgo = (DEMO_WINDOW_DAYS - 1 - day) * 24 * 60 * 60 * 1000;
        const offsetInDay = Math.floor(rngTime() * 24 * 60 * 60 * 1000);
        clicks.push({
          id: demoClickId(link.code, index),
          code: link.code,
          createdMsAgo: dayStartMsAgo + offsetInDay,
        });
        index += 1;
      }
    }
  }

  clicks.sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: DEMO_SEED_VERSION,
    links,
    clicks,
  };
}

export function summarizeDemoPlan(plan: DemoSeedPlan): {
  linkCount: number;
  clickCount: number;
  zeroClickLinks: number;
  codes: string[];
} {
  const clickCounts = new Map<string, number>();
  for (const link of plan.links) clickCounts.set(link.code, 0);
  for (const click of plan.clicks) {
    clickCounts.set(click.code, (clickCounts.get(click.code) ?? 0) + 1);
  }

  let zeroClickLinks = 0;
  for (const count of clickCounts.values()) {
    if (count === 0) zeroClickLinks += 1;
  }

  return {
    linkCount: plan.links.length,
    clickCount: plan.clicks.length,
    zeroClickLinks,
    codes: plan.links.map((link) => link.code),
  };
}
