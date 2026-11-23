import Link from "next/link";

import { formatDate, npr } from "@/lib/format";
import type { Play } from "@/lib/types";

import { Poster } from "./Poster";

export function PlayCard({ play }: { play: Play }) {
  const minPrice = play.play_ticket_tiers?.length
    ? Math.min(...play.play_ticket_tiers.map((t) => t.price_npr))
    : null;
  return (
    <Link
      href={`/stage/${play.id}/`}
      className="group overflow-hidden rounded-xl bg-card ring-1 ring-line transition hover:ring-primary"
    >
      <Poster src={play.poster_url} alt={`${play.title} poster`} />
      <div className="space-y-0.5 p-3">
        <h3 className="line-clamp-1 font-semibold text-text group-hover:text-primary">{play.title}</h3>
        <p className="line-clamp-1 text-xs text-muted">{play.venue?.name ?? "Venue TBA"}</p>
        <p className="text-xs text-muted">
          {play.start_date ? `${formatDate(play.start_date)}${play.end_date ? ` – ${formatDate(play.end_date)}` : ""}` : "Dates TBA"}
        </p>
        {minPrice != null && <p className="pt-1 text-xs font-semibold text-primary">From {npr(minPrice)}</p>}
      </div>
    </Link>
  );
}
