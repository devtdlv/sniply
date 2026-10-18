import { prisma } from "@/lib/prisma";

/**
 * Analytics timezone convention:
 * All day buckets and range windows use UTC calendar days.
 * A day key is `YYYY-MM-DD` in UTC. Range filters are inclusive of
 * today's UTC day.
 */
export const ANALYTICS_TIMEZONE = "UTC" as const;

export const ANALYTICS_RANGES = ["7d", "30d", "all"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type DayBucket = {
  date: string;
  clicks: number;
};

export type OverviewAnalytics = {
  timezone: typeof ANALYTICS_TIMEZONE;
  range: AnalyticsRange;
  totalLinks: number;
  totalClicks: number;
  rangeClicks: number;
  series: DayBucket[];
};

export type LinkAnalytics = {
  timezone: typeof ANALYTICS_TIMEZONE;
  range: AnalyticsRange;
  link: {
    id: string;
    code: string;
    destination: string;
    shortUrl: string;
    createdAt: Date;
    totalClicks: number;
  };
  rangeClicks: number;
  series: DayBucket[];
};

export type AnalyticsRangeParseResult =
  | { ok: true; range: AnalyticsRange }
  | { ok: false; error: string };

type ClickDayRow = {
  day: string;
  count: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseAnalyticsRange(
  raw: string | null | undefined,
): AnalyticsRangeParseResult {
  const value = (raw ?? "7d").trim().toLowerCase();
  if (!ANALYTICS_RANGES.includes(value as AnalyticsRange)) {
    return {
      ok: false,
      error: `range must be one of: ${ANALYTICS_RANGES.join(", ")}`,
    };
  }
  return { ok: true, range: value as AnalyticsRange };
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
  return new Date(startOfUtcDay(date).getTime() + MS_PER_DAY - 1);
}

/** Inclusive UTC day list from `from` through `to`. */
export function eachUtcDay(from: Date, to: Date): string[] {
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  if (start.getTime() > end.getTime()) return [];

  const days: string[] = [];
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += MS_PER_DAY) {
    days.push(utcDayKey(new Date(cursor)));
  }
  return days;
}

/**
 * Fixed window for 7d/30d: N UTC days ending today (inclusive).
 * For `all`, returns null from (unbounded) and an empty day list placeholder;
 * callers derive the series start from data.
 */
export function getRangeBounds(
  range: AnalyticsRange,
  now = new Date(),
): { from: Date | null; to: Date; fixedDays: string[] | null } {
  const todayStart = startOfUtcDay(now);
  const to = endOfUtcDay(now);

  if (range === "all") {
    return { from: null, to, fixedDays: null };
  }

  const dayCount = range === "7d" ? 7 : 30;
  const from = new Date(todayStart.getTime() - (dayCount - 1) * MS_PER_DAY);
  return {
    from,
    to,
    fixedDays: eachUtcDay(from, todayStart),
  };
}

export function fillDaySeries(
  days: string[],
  counts: Map<string, number>,
): DayBucket[] {
  return days.map((date) => ({
    date,
    clicks: counts.get(date) ?? 0,
  }));
}

export function rowsToCountMap(rows: ClickDayRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.day, Number(row.count));
  }
  return map;
}

async function queryClickDays(options: {
  from: Date | null;
  to: Date;
  linkId?: string;
}): Promise<ClickDayRow[]> {
  if (options.linkId) {
    if (options.from) {
      return prisma.$queryRaw<ClickDayRow[]>`
        SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM "Click"
        WHERE "linkId" = ${options.linkId}
          AND "createdAt" >= ${options.from}
          AND "createdAt" <= ${options.to}
        GROUP BY 1
        ORDER BY 1 ASC
      `;
    }

    return prisma.$queryRaw<ClickDayRow[]>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Click"
      WHERE "linkId" = ${options.linkId}
        AND "createdAt" <= ${options.to}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  if (options.from) {
    return prisma.$queryRaw<ClickDayRow[]>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Click"
      WHERE "createdAt" >= ${options.from}
        AND "createdAt" <= ${options.to}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  return prisma.$queryRaw<ClickDayRow[]>`
    SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS count
    FROM "Click"
    WHERE "createdAt" <= ${options.to}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
}

function buildSeriesForRange(
  range: AnalyticsRange,
  rows: ClickDayRow[],
  now: Date,
): DayBucket[] {
  const counts = rowsToCountMap(rows);
  const bounds = getRangeBounds(range, now);

  if (bounds.fixedDays) {
    return fillDaySeries(bounds.fixedDays, counts);
  }

  if (counts.size === 0) {
    return [];
  }

  const firstDay = [...counts.keys()].sort()[0]!;
  const days = eachUtcDay(new Date(`${firstDay}T00:00:00.000Z`), now);
  return fillDaySeries(days, counts);
}

export async function getOverviewAnalytics(
  range: AnalyticsRange,
  now = new Date(),
): Promise<OverviewAnalytics> {
  const bounds = getRangeBounds(range, now);

  const [totalLinks, totalClicks, rangeClicks, rows] = await Promise.all([
    prisma.link.count(),
    prisma.click.count(),
    prisma.click.count({
      where: {
        createdAt: {
          ...(bounds.from ? { gte: bounds.from } : {}),
          lte: bounds.to,
        },
      },
    }),
    queryClickDays({ from: bounds.from, to: bounds.to }),
  ]);

  return {
    timezone: ANALYTICS_TIMEZONE,
    range,
    totalLinks,
    totalClicks,
    rangeClicks,
    series: buildSeriesForRange(range, rows, now),
  };
}

export async function getLinkAnalytics(
  code: string,
  range: AnalyticsRange,
  shortUrl: string,
  now = new Date(),
): Promise<LinkAnalytics | null> {
  const link = await prisma.link.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      destination: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
  });

  if (!link) return null;

  const bounds = getRangeBounds(range, now);

  const [rangeClicks, rows] = await Promise.all([
    prisma.click.count({
      where: {
        linkId: link.id,
        createdAt: {
          ...(bounds.from ? { gte: bounds.from } : {}),
          lte: bounds.to,
        },
      },
    }),
    queryClickDays({ from: bounds.from, to: bounds.to, linkId: link.id }),
  ]);

  return {
    timezone: ANALYTICS_TIMEZONE,
    range,
    link: {
      id: link.id,
      code: link.code,
      destination: link.destination,
      shortUrl,
      createdAt: link.createdAt,
      totalClicks: link._count.clicks,
    },
    rangeClicks,
    series: buildSeriesForRange(range, rows, now),
  };
}
