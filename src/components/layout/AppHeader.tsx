import Link from "next/link";

type AppHeaderProps = {
  active?: "dashboard" | "link";
};

export function AppHeader({ active = "dashboard" }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(245,248,250,0.86)] backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Sniply home"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold tracking-tight text-white shadow-[0_8px_20px_rgba(11,110,79,0.28)]"
          >
            S
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">Sniply</p>
            <p className="text-xs text-[var(--muted)]">
              Short links. Clear insights.
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
          <Link
            href="/"
            className={
              active === "dashboard"
                ? "font-medium text-[var(--fg)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }
            aria-current={active === "dashboard" ? "page" : undefined}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
