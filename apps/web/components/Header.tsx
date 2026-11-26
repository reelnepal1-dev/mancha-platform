import Link from "next/link";

const NAV = [
  { href: "/movies/", label: "Movies" },
  { href: "/stage/", label: "Stage" },
  { href: "/events/", label: "Events" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="Mancha logo" width={32} height={32} className="h-8 w-8 rounded-md" />
          <span className="text-xl font-bold text-text">Mancha</span>
          <span className="text-sm text-primary">मञ्च</span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-1.5 text-muted transition hover:bg-card hover:text-text"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
