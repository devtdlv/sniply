"use client";

import type { ListSort } from "@/lib/list-query";

type LinksToolbarProps = {
  search: string;
  sort: ListSort;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ListSort) => void;
  disabled?: boolean;
};

export function LinksToolbar({
  search,
  sort,
  onSearchChange,
  onSortChange,
  disabled = false,
}: LinksToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="block min-w-0 flex-1 sm:max-w-md">
        <span className="sr-only">Search links</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by destination or short code"
          className="input-field"
          disabled={disabled}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="whitespace-nowrap">Sort by</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ListSort)}
          className="input-field w-auto min-w-[10.5rem]"
          disabled={disabled}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_clicked">Most clicked</option>
        </select>
      </label>
    </div>
  );
}
