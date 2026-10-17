"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import type { CreateLinkResponse } from "@/components/dashboard/types";
import { CopyButton } from "@/components/dashboard/CopyButton";

type CreateLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (link: CreateLinkResponse) => void;
};

export function CreateLinkDialog({
  open,
  onClose,
  onCreated,
}: CreateLinkDialogProps) {
  const titleId = useId();
  const destinationRef = useRef<HTMLInputElement>(null);
  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateLinkResponse | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDestination("");
    setAlias("");
    setError(null);
    setCreated(null);
    setPending(false);
    const timer = window.setTimeout(() => destinationRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setCreated(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          alias: alias.trim() ? alias.trim() : undefined,
        }),
      });

      const data = (await response.json()) as CreateLinkResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not create short link");
        return;
      }

      setCreated(data);
      onCreated(data);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(19,32,41,0.42)] p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)] sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight">
              Create link
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Shorten a destination URL with an optional custom alias.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost px-2 py-1 text-sm"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
              Link created successfully.
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs tracking-wide text-[var(--muted)] uppercase">
                Short URL
              </p>
              <a
                href={created.shortUrl}
                className="mt-1 block break-all text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {created.shortUrl}
              </a>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyButton value={created.shortUrl} label="Copy short URL" />
                <span className="font-mono text-sm text-[var(--muted)]">
                  /{created.code}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--muted)]">Destination URL</span>
              <input
                ref={destinationRef}
                type="url"
                required
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="https://example.com/path"
                className="input-field"
                disabled={pending}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--muted)]">
                Custom alias (optional)
              </span>
              <input
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                placeholder="my-link"
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_-]+"
                title="Letters, numbers, underscores, and hyphens only"
                className="input-field font-mono"
                disabled={pending}
              />
            </label>

            {error ? (
              <p
                className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Creating…" : "Create short link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
