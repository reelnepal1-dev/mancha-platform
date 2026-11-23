import Link from "next/link";

import { languageName, STATUS_LABEL } from "@/lib/format";
import type { Movie } from "@/lib/types";

import { Poster } from "./Poster";

export function MovieCard({ movie }: { movie: Movie }) {
  const released = movie.status === "now_showing";
  const score = released ? movie.community_rating : movie.hype_rating;
  return (
    <Link
      href={`/movies/${movie.id}/`}
      className="group overflow-hidden rounded-xl bg-card ring-1 ring-line transition hover:ring-primary"
    >
      <div className="relative">
        <Poster src={movie.poster_url} alt={`${movie.title} poster`} />
        <span className="absolute left-2 top-2 rounded-full bg-bg/85 px-2 py-0.5 text-[11px] font-medium text-text">
          {STATUS_LABEL[movie.status] ?? movie.status}
        </span>
        {score != null && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-text">
            {released ? "★" : "🔥"} {score.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold text-text group-hover:text-primary">{movie.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
          {[languageName(movie.original_language), movie.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
