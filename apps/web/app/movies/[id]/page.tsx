/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookButton } from "@/components/BookButton";
import { Poster } from "@/components/Poster";
import { Reviews } from "@/components/Reviews";
import { getMovie, getMovies, getReviews } from "@/lib/data";
import { formatDate, languageName, nprCompact, STATUS_LABEL, truncate } from "@/lib/format";
import type { ExternalRating } from "@/lib/types";

export const dynamicParams = false;
const PLACEHOLDER = "_";

export async function generateStaticParams() {
  const movies = await getMovies(1000);
  return movies.length ? movies.map((m) => ({ id: m.id })) : [{ id: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/movies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const movie = id === PLACEHOLDER ? null : await getMovie(id);
  if (!movie) return { title: "Movie not found", robots: { index: false } };

  const year = movie.release_date_np?.slice(0, 4);
  const title = `${movie.title}${year ? ` (${year})` : ""} — Showtimes, Reviews & Tickets in Nepal`;
  const description = truncate(movie.synopsis) || `${movie.title} in Nepal cinemas: ratings, reviews and tickets.`;
  return {
    title,
    description,
    alternates: { canonical: `/movies/${movie.id}/` },
    openGraph: {
      title,
      description,
      type: "video.movie",
      images: movie.backdrop_url || movie.poster_url ? [{ url: (movie.backdrop_url || movie.poster_url)! }] : undefined,
    },
  };
}

const SOURCE_LABEL: Record<ExternalRating["source"], string> = {
  imdb: "IMDb",
  rotten_tomatoes: "Rotten Tomatoes",
  metacritic: "Metacritic",
  tmdb: "TMDB",
};
const SOURCE_ORDER: ExternalRating["source"][] = ["imdb", "rotten_tomatoes", "tmdb", "metacritic"];

function Score({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ring-1 ${accent ? "bg-primary/15 ring-primary" : "bg-card ring-line"}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`text-lg font-bold ${accent ? "text-primary" : "text-text"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export default async function MoviePage({ params }: PageProps<"/movies/[id]">) {
  const { id } = await params;
  const movie = id === PLACEHOLDER ? null : await getMovie(id);
  if (!movie) notFound();

  const reviews = await getReviews("movie", movie.id);
  const external = [...(movie.movie_external_ratings ?? [])].sort(
    (a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source),
  );
  const released = movie.status === "now_showing" || movie.status === "archived";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    image: movie.poster_url ?? undefined,
    datePublished: movie.release_date_np ?? undefined,
    genre: movie.genres,
    inLanguage: movie.original_language ?? undefined,
    duration: movie.runtime_minutes ? `PT${movie.runtime_minutes}M` : undefined,
    description: movie.synopsis ?? undefined,
    trailer: movie.trailer_url ? { "@type": "VideoObject", embedUrl: movie.trailer_url, name: `${movie.title} trailer` } : undefined,
    aggregateRating:
      movie.community_rating != null && movie.community_rating_count > 0
        ? { "@type": "AggregateRating", ratingValue: movie.community_rating, bestRating: 10, ratingCount: movie.community_rating_count }
        : undefined,
  };

  return (
    <article className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {movie.backdrop_url && (
        <div className="relative -mx-4 -mt-8 h-56 overflow-hidden sm:h-80">
          <img src={movie.backdrop_url} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
        </div>
      )}

      <div className={`flex flex-col gap-6 sm:flex-row ${movie.backdrop_url ? "-mt-32 relative" : ""}`}>
        <div className="w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:w-56">
          <Poster src={movie.poster_url} alt={`${movie.title} poster`} />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-primary ring-1 ring-line">
              {STATUS_LABEL[movie.status] ?? movie.status}
            </span>
            <h1 className="mt-2 text-3xl font-bold text-text sm:text-4xl">{movie.title}</h1>
            {movie.title_ne && <p className="text-lg text-muted">{movie.title_ne}</p>}
            <p className="mt-1 text-sm text-muted">
              {[
                formatDate(movie.release_date_np),
                movie.runtime_minutes && `${movie.runtime_minutes} min`,
                movie.certification,
                movie.languages.map(languageName).join(", "),
                movie.genres.join(", "),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {released ? (
              <Score
                label="Mancha rating"
                value={movie.community_rating != null ? `${movie.community_rating.toFixed(1)}/10` : "—"}
                sub={`${movie.community_rating_count} reviews`}
                accent
              />
            ) : (
              <Score
                label="Hype rating"
                value={movie.hype_rating != null ? `🔥 ${movie.hype_rating.toFixed(1)}/10` : "—"}
                sub={`${movie.hype_rating_count} pre-release`}
                accent
              />
            )}
            {external.map((r) => (
              <Score key={r.source} label={SOURCE_LABEL[r.source]} value={r.display_value ?? `${r.score}/${r.max_score}`} />
            ))}
            {movie.box_office_npr != null && <Score label="Box office (Nepal)" value={nprCompact(movie.box_office_npr)} />}
          </div>

          <div className="flex flex-wrap gap-3">
            <BookButton href={movie.booking_url} />
            {movie.trailer_url && (
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-text ring-1 ring-line hover:ring-primary"
              >
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>
      </div>

      {movie.synopsis && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-text">Synopsis</h2>
          <p className="max-w-3xl leading-7 text-muted">{movie.synopsis}</p>
          <p className="text-xs text-muted/70">Spoiler-free.</p>
        </section>
      )}

      <Reviews kind="movie" id={movie.id} initial={reviews} />
    </article>
  );
}
