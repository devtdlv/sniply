"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/qr-encode";

type QrCardProps = {
  code: string;
  shortUrl: string;
};

export function QrCard({ code, shortUrl }: QrCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = await generateQrDataUrl(shortUrl);
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) {
          setError("Could not generate QR preview.");
          setDataUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [shortUrl]);

  return (
    <section
      id="qr"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)] sm:p-5"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">QR code</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Encodes <span className="break-all font-mono text-[var(--fg)]">{shortUrl}</span>
        </p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="grid h-52 w-52 place-items-center rounded-xl border border-[var(--border)] bg-white p-3">
          {loading ? (
            <div className="skeleton h-full w-full rounded-lg" aria-hidden="true" />
          ) : error ? (
            <p className="px-2 text-center text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`QR code for ${shortUrl}`}
              className="h-full w-full"
            />
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="max-w-sm text-sm text-[var(--muted)]">
            Download a PNG generated locally. No external QR service is used.
          </p>
          <a
            className="btn btn-primary"
            href={`/api/links/${encodeURIComponent(code)}/qr`}
            download={`sniply-${code}.png`}
          >
            Download PNG
          </a>
        </div>
      </div>
    </section>
  );
}
