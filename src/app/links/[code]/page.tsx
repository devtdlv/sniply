import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkAnalyticsPanel } from "@/components/analytics/LinkAnalyticsPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { parseRouteCode } from "@/lib/route-code";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function LinkDetailPage({ params }: PageProps) {
  const { code } = await params;
  const trimmed = parseRouteCode(code);

  if (!trimmed) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AppHeader active="link" />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        <div className="animate-fade-up mb-6">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Link analytics
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Review click trends and download a QR code for{" "}
            <span className="font-mono text-[var(--fg)]">/{trimmed}</span>.
          </p>
        </div>

        <LinkAnalyticsPanel code={trimmed} />
      </main>
    </div>
  );
}
