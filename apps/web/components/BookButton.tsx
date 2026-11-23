type Props = { href: string | null | undefined; label?: string; className?: string };

/** External booking redirect. Uses the Ticket CTA colour (#E76F51) only. */
export function BookButton({ href, label = "Book Ticket", className = "" }: Props) {
  if (!href) {
    return (
      <span
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-card px-5 py-2.5 text-sm font-semibold text-muted ring-1 ring-line ${className}`}
      >
        Booking not open yet
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-ticket px-5 py-2.5 text-sm font-semibold text-text shadow-lg shadow-ticket/20 transition hover:brightness-110 ${className}`}
    >
      🎟 {label}
      <span aria-hidden>↗</span>
    </a>
  );
}
