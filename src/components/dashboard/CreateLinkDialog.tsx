"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import type { CreateLinkResponse } from "@/components/dashboard/types";
import { CopyButton } from "@/components/dashboard/CopyButton";

type CreateLinkDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (link: CreateLinkResponse) => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CreateLinkDialog({
  open,
  onClose,
  onCreated,
}: CreateLinkDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateLinkResponse | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setDestination("");
    setAlias("");
    setError(null);
    setCreated(null);
    setPending(false);

    const timer = window.setTimeout(() => destinationRef.current?.focus(), 40);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
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
      window.setTimeout(() => {
        dialogRef.current
          ?.querySelector<HTMLElement>('button.btn-primary')
          ?.focus();
      }, 0);
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="animate-fade-up w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow)] sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight">
              Create link
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-[var(--muted)]">
              Shorten a destination URL with an optional custom alias.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost px-2 py-1 text-sm"
            onClick={onClose}
            disabled={pending}
            aria-label="Close create link dialog"
          >
            Close
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div
              className="rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]"
              role="status"
              aria-live="polite"
            >
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
                autoComplete="url"
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
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            {error ? (
              <p
                className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
                role="alert"
                aria-live="assertive"
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Creating…" : "Create short link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
