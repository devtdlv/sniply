"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateLinkDialog } from "@/components/dashboard/CreateLinkDialog";
import { LinksTable } from "@/components/dashboard/LinksTable";
import { LinksToolbar } from "@/components/dashboard/LinksToolbar";
import { Pagination } from "@/components/dashboard/Pagination";
import type {
  CreateLinkResponse,
  DashboardLink,
  LinksListResponse,
} from "@/components/dashboard/types";
import { DEFAULT_PAGE_SIZE, type ListSort } from "@/lib/list-query";

type ToastState = {
  message: string;
  tone: "success" | "danger";
} | null;

export function Dashboard() {
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ListSort>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(DEFAULT_PAGE_SIZE),
      sort,
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    return params.toString();
  }, [page, sort, debouncedSearch]);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/links?${queryString}`);
      const data = (await response.json()) as LinksListResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not load links");
        setLinks([]);
        setTotal(0);
        setTotalPages(0);
        return;
      }

      setLinks(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch {
      setError("Network error. Could not load links.");
      setLinks([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [queryString, page]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks, reloadToken]);

  function onCreated(link: CreateLinkResponse) {
    setToast({
      message: `Created ${link.shortUrl}`,
      tone: "success",
    });
    setSearchInput("");
    setDebouncedSearch("");
    setSort("newest");
    setPage(1);
    setReloadToken((value) => value + 1);
  }

  const emptyTitle = debouncedSearch ? "No matching links" : "No links yet";
  const emptyMessage = debouncedSearch
    ? "No links match your search. Try a different destination or code."
    : "Create your first short link to see it appear here.";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(245,248,250,0.86)] backdrop-blur-md">
        <div className="mx-auto flex h-[var(--header-h)] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold tracking-tight text-white shadow-[0_8px_20px_rgba(11,110,79,0.28)]"
            >
              S
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">Sniply</p>
              <p className="text-xs text-[var(--muted)]">Local-first short links</p>
            </div>
          </div>
          <p className="hidden text-sm text-[var(--muted)] sm:block">
            Portfolio project
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="animate-fade-up mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Links
            </h1>
            <p className="mt-2 max-w-xl text-[var(--muted)]">
              Create short URLs, search your library, and track total clicks.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => setCreateOpen(true)}
          >
            Create link
          </button>
        </section>

        <section className="animate-fade-up overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow)]">
          <div className="border-b border-[var(--border)] p-4 sm:p-5">
            <LinksToolbar
              search={searchInput}
              sort={sort}
              onSearchChange={setSearchInput}
              onSortChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              disabled={loading && links.length === 0}
            />
          </div>

          <LinksTable
            links={links}
            loading={loading}
            error={error}
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
            onRetry={() => setReloadToken((value) => value + 1)}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        </section>
      </main>

      <CreateLinkDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreated}
      />

      {toast ? (
        <div
          className="animate-toast-in fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow)]"
          style={{
            background:
              toast.tone === "success"
                ? "var(--success-soft)"
                : "var(--danger-soft)",
            color:
              toast.tone === "success" ? "var(--success)" : "var(--danger)",
            borderColor: "transparent",
          }}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
