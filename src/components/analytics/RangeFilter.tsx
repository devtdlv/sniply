"use client";

import type { AnalyticsRange } from "@/lib/analytics";

type RangeFilterProps = {
  value: AnalyticsRange;
  onChange: (value: AnalyticsRange) => void;
  disabled?: boolean;
};

const OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export function RangeFilter({
  value,
  onChange,
  disabled = false,
}: RangeFilterProps) {
  return (
    <div
      className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1"
      role="group"
      aria-label="Date range"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              active
                ? "bg-[var(--bg-elevated)] font-medium text-[var(--fg)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
