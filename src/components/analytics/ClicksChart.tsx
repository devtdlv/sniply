"use client";

import type { DayBucket } from "@/lib/analytics";

type ClicksChartProps = {
  series: DayBucket[];
  loading?: boolean;
  emptyLabel?: string;
};

function formatTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function ClicksChart({
  series,
  loading = false,
  emptyLabel = "No clicks in this range yet.",
}: ClicksChartProps) {
  if (loading) {
    return <div className="skeleton h-56 w-full rounded-xl" aria-hidden="true" />;
  }

  if (series.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 text-center text-sm text-[var(--muted)]">
        {emptyLabel}
      </div>
    );
  }

  const max = Math.max(...series.map((point) => point.clicks), 0);
  const chartMax = Math.max(max, 1);
  const width = 640;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 36, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const gap = series.length > 40 ? 1 : series.length > 20 ? 2 : 4;
  const barWidth = Math.max(
    2,
    (innerWidth - gap * (series.length - 1)) / series.length,
  );

  const totalInRange = series.reduce((sum, point) => sum + point.clicks, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full min-w-[280px]"
          role="img"
          aria-label={`Clicks over time, ${totalInRange} total in selected range`}
        >
          {[0, 0.5, 1].map((fraction) => {
            const y = padding.top + innerHeight * (1 - fraction);
            const label = Math.round(chartMax * fraction);
            return (
              <g key={fraction}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={fraction === 0 ? undefined : "4 4"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--muted)]"
                  fontSize="11"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {series.map((point, index) => {
            const barHeight =
              point.clicks === 0 ? 0 : (point.clicks / chartMax) * innerHeight;
            const x = padding.left + index * (barWidth + gap);
            const y = padding.top + innerHeight - barHeight;
            const showTick =
              series.length <= 10 ||
              index === 0 ||
              index === series.length - 1 ||
              index % Math.ceil(series.length / 6) === 0;

            return (
              <g key={point.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, point.clicks > 0 ? 2 : 0)}
                  rx="3"
                  fill="var(--accent)"
                  opacity={point.clicks > 0 ? 0.9 : 0.2}
                >
                  <title>
                    {point.date} (UTC): {point.clicks} clicks
                  </title>
                </rect>
                {showTick ? (
                  <text
                    x={x + barWidth / 2}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-[var(--muted)]"
                    fontSize="10"
                  >
                    {formatTick(point.date)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      {totalInRange === 0 ? (
        <p className="text-sm text-[var(--muted)]">{emptyLabel}</p>
      ) : null}
    </div>
  );
}
