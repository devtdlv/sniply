"use client";

import { useCallback, useEffect, useState } from "react";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { RangeFilter } from "@/components/analytics/RangeFilter";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { QrCard } from "@/components/qr/QrCard";
import type { AnalyticsRange, DayBucket } from "@/lib/analytics";

type LinkAnalyticsResponse = {
  timezone: "UTC";
  range: AnalyticsRange;
  link: {
    id: string;
    code: string;
    destination: string;
    shortUrl: string;
    createdAt: string;
    totalClicks: number;
  };
  rangeClicks: number;
  series: DayBucket[];
  error?: string;
};

type LinkAnalyticsPanelProps = {
  code: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function LinkAnalyticsPanel({ code }: LinkAnalyticsPanelProps) {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LinkAnalyticsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics/${encodeURIComponent(code)}?range=${range}`,
      );
      const json = (await response.json()) as LinkAnalyticsResponse;

      if (!response.ok) {
        setError(json.error ?? "Could not load link analytics");
        setData(null);
        return;
      }

      setData(json);
    } catch {
      setError("Network error. Could not load link analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [code, range]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)]">
        <p className="text-[var(--danger)]" role="alert">
          {error}
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => void load()}
        >
          Try again
        </button>
      </div>
    );
  }

  const link = data?.link;

  return (
    <div className="space-y-6">
      <section className="animate-fade-up rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)] sm:p-5">
        {loading && !link ? (
          <div className="space-y-3">
            <div className="skeleton h-8 w-48 rounded-md" />
            <div className="skeleton h-5 w-full max-w-xl rounded-md" />
            <div className="skeleton h-5 w-64 rounded-md" />
          </div>
        ) : link ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-[var(--muted)] uppercase">
                  Short URL
                </p>
                <a
                  href={link.shortUrl}
                  className="mt-1 block break-all text-xl font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {link.shortUrl}
                </a>
              </div>
              <CopyButton value={link.shortUrl} label="Copy short URL" />
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">
                  Destination
                </dt>
                <dd className="mt-1 break-all text-sm">{link.destination}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">
                  Created
                </dt>
                <dd className="mt-1 text-sm">{formatDate(link.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">
                  Total clicks
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {link.totalClicks}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">
                  Clicks in range
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {data?.rangeClicks ?? 0}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>

      <section className="animate-fade-up rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Click activity
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Daily totals in UTC.
            </p>
          </div>
          <RangeFilter value={range} onChange={setRange} disabled={loading} />
        </div>
        <div className="p-4 sm:p-5">
          <ClicksChart
            series={data?.series ?? []}
            loading={loading && !data}
            emptyLabel="No clicks in this range yet."
          />
        </div>
      </section>

      {link ? <QrCard code={link.code} shortUrl={link.shortUrl} /> : null}
    </div>
  );
}
