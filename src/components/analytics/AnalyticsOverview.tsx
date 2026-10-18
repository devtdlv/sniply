"use client";

import { useCallback, useEffect, useState } from "react";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { RangeFilter } from "@/components/analytics/RangeFilter";
import type { AnalyticsRange, DayBucket } from "@/lib/analytics";

type OverviewResponse = {
  timezone: "UTC";
  range: AnalyticsRange;
  totalLinks: number;
  totalClicks: number;
  rangeClicks: number;
  series: DayBucket[];
  error?: string;
};

type AnalyticsOverviewProps = {
  refreshToken?: number;
};

export function AnalyticsOverview({ refreshToken = 0 }: AnalyticsOverviewProps) {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OverviewResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics?range=${range}`);
      const json = (await response.json()) as OverviewResponse;

      if (!response.ok) {
        setError(json.error ?? "Could not load analytics");
        setData(null);
        return;
      }

      setData(json);
    } catch {
      setError("Network error. Could not load analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  return (
    <section className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)] sm:mb-8">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Click activity in UTC day buckets.
          </p>
        </div>
        <RangeFilter value={range} onChange={setRange} disabled={loading} />
      </div>

      <div className="grid gap-3 border-b border-[var(--border)] p-4 sm:grid-cols-3 sm:p-5">
        <StatCard
          label="Total links"
          value={data?.totalLinks}
          loading={loading && !data}
        />
        <StatCard
          label="Total clicks"
          value={data?.totalClicks}
          loading={loading && !data}
        />
        <StatCard
          label="Clicks in range"
          value={data?.rangeClicks}
          loading={loading && !data}
        />
      </div>

      <div className="p-4 sm:p-5">
        {error ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[var(--danger)]" role="alert">
              {error}
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => void load()}>
              Try again
            </button>
          </div>
        ) : (
          <ClicksChart
            series={data?.series ?? []}
            loading={loading && !data}
            emptyLabel={
              data && data.totalLinks === 0
                ? "Create a link and collect clicks to see analytics."
                : "No clicks in this range yet."
            }
          />
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <p className="text-xs tracking-wide text-[var(--muted)] uppercase">
        {label}
      </p>
      {loading ? (
        <div className="skeleton mt-2 h-8 w-16 rounded-md" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
          {value ?? 0}
        </p>
      )}
    </div>
  );
}
