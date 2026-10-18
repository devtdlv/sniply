"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-sm text-[var(--muted)]" aria-live="polite">
        Showing {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary px-3 py-1.5 text-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Go to previous page"
        >
          Previous
        </button>
        <span className="min-w-[5.5rem] text-center text-sm text-[var(--muted)]">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary px-3 py-1.5 text-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
