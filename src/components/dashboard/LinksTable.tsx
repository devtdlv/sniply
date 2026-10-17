"use client";

import type { DashboardLink } from "@/components/dashboard/types";
import { CopyButton } from "@/components/dashboard/CopyButton";

type LinksTableProps = {
  links: DashboardLink[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyMessage: string;
  onRetry: () => void;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="skeleton h-16 rounded-xl"
          style={{ animationDelay: `${index * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function LinksTable({
  links,
  loading,
  error,
  emptyTitle,
  emptyMessage,
  onRetry,
}: LinksTableProps) {
  if (loading) {
    return <LoadingRows />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 px-4 py-10 sm:px-6">
        <p className="text-[var(--danger)]" role="alert">
          {error}
        </p>
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="px-4 py-14 text-center sm:px-6">
        <p className="text-lg font-medium">{emptyTitle}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs tracking-wide text-[var(--muted)] uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Short URL</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, index) => (
              <tr
                key={link.id}
                className="animate-fade-up border-b border-[var(--border)] last:border-b-0"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <td className="max-w-[220px] px-4 py-3 align-top">
                  <a
                    href={link.shortUrl}
                    className="break-all text-[var(--accent)] underline-offset-4 hover:underline"
                  >
                    {link.shortUrl}
                  </a>
                </td>
                <td className="max-w-[280px] px-4 py-3 align-top break-all text-[var(--muted)]">
                  {link.destination}
                </td>
                <td className="px-4 py-3 align-top font-mono">{link.code}</td>
                <td className="px-4 py-3 align-top tabular-nums">
                  {link.clickCount}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap text-[var(--muted)]">
                  {formatDate(link.createdAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  <CopyButton value={link.shortUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[var(--border)] md:hidden">
        {links.map((link, index) => (
          <li
            key={link.id}
            className="animate-fade-up space-y-3 px-4 py-4"
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <a
                href={link.shortUrl}
                className="break-all font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {link.shortUrl}
              </a>
              <CopyButton value={link.shortUrl} />
            </div>
            <p className="break-all text-sm text-[var(--muted)]">
              {link.destination}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              <span className="font-mono text-[var(--fg)]">/{link.code}</span>
              <span>{link.clickCount} clicks</span>
              <span>{formatDate(link.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
