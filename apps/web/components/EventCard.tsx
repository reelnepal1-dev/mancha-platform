import { formatDateTime } from "@/lib/format";
import type { EventItem } from "@/lib/types";

import { BookButton } from "./BookButton";
import { Poster } from "./Poster";
import { PriceBadge } from "./PriceBadge";

export function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="flex gap-4 overflow-hidden rounded-xl bg-card p-3 ring-1 ring-line">
      <div className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
        <Poster src={event.poster_url} alt={`${event.title} poster`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{event.category}</span>
          <PriceBadge isFree={event.is_free} min={event.price_min_npr} max={event.price_max_npr} />
        </div>
        <h3 className="text-base font-semibold text-text">{event.title}</h3>
        <p className="text-xs text-muted">
          {formatDateTime(event.starts_at)}
          {event.venue ? ` · ${event.venue.name}, ${event.venue.city}` : ""}
        </p>
        {event.performers.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {event.performers.map((p) => (
              <li key={p} className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-text ring-1 ring-line">
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-1">
          {event.is_free && !event.booking_url ? (
            <span className="text-xs text-muted">Free entry, no ticket needed</span>
          ) : (
            <BookButton href={event.booking_url} label={event.is_free ? "Register" : "Get Tickets"} className="!px-4 !py-2 !text-xs" />
          )}
        </div>
      </div>
    </article>
  );
}
