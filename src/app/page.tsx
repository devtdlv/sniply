"use client";

import { FormEvent, useState } from "react";

type CreateResponse = {
  id: string;
  code: string;
  destination: string;
  shortUrl: string;
  createdAt: string;
};

type ApiError = {
  error?: string;
};

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState<CreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          alias: alias.trim() ? alias.trim() : undefined,
        }),
      });

      const data = (await response.json()) as CreateResponse & ApiError;

      if (!response.ok) {
        setError(data.error ?? "Could not create short link");
        return;
      }

      setResult(data);
      setDestination("");
      setAlias("");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="mb-2 text-sm tracking-[0.2em] text-[var(--muted)] uppercase">
        Portfolio project
      </p>
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">Sniply</h1>
      <p className="mb-10 text-[var(--muted)]">
        Local-first URL shortener. Create a short link, then open it to redirect.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
      >
        <label className="block space-y-2">
          <span className="text-sm text-[var(--muted)]">Destination URL</span>
          <input
            type="url"
            required
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="https://example.com/path"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:border-[var(--accent)]"
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
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-medium text-[var(--bg)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create short link"}
        </button>
      </form>

      {error ? (
        <p className="mt-6 text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <p className="text-sm text-[var(--muted)]">Short URL</p>
          <a
            href={result.shortUrl}
            className="break-all text-lg text-[var(--accent)] underline-offset-4 hover:underline"
          >
            {result.shortUrl}
          </a>
          <p className="text-sm text-[var(--muted)]">
            Code: <span className="text-[var(--fg)]">{result.code}</span>
          </p>
        </div>
      ) : null}
    </main>
  );
}
