import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookButton } from "@/components/BookButton";
import { Poster } from "@/components/Poster";
import { Reviews } from "@/components/Reviews";
import { getPlay, getPlays, getReviews } from "@/lib/data";
import { formatDate, languageName, npr, STATUS_LABEL, truncate } from "@/lib/format";

export const dynamicParams = false;
const PLACEHOLDER = "_";

export async function generateStaticParams() {
  const plays = await getPlays();
  return plays.length ? plays.map((p) => ({ id: p.id })) : [{ id: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/stage/[id]">): Promise<Metadata> {
  const { id } = await params;
  const play = id === PLACEHOLDER ? null : await getPlay(id);
  if (!play) return { title: "Play not found", robots: { index: false } };

  const where = play.venue ? ` at ${play.venue.name}, ${play.venue.city}` : "";
  const title = `${play.title} — Theatre Play${where} | Tickets & Showtimes`;
  const description = truncate(play.synopsis) || `${play.title}${where}: cast, show timings and NPR ticket prices.`;
  return {
    title,
    description,
    alternates: { canonical: `/stage/${play.id}/` },
    openGraph: { title, description, images: play.poster_url ? [{ url: play.poster_url }] : undefined },
  };
}

export default async function PlayPage({ params }: PageProps<"/stage/[id]">) {
  const { id } = await params;
  const play = id === PLACEHOLDER ? null : await getPlay(id);
  if (!play) notFound();

  const reviews = await getReviews("play", play.id);
  const tiers = [...(play.play_ticket_tiers ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.price_npr - b.price_npr);
  const cast = Array.isArray(play.cast_members) ? play.cast_members : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    name: play.title,
    startDate: play.start_date ?? undefined,
    endDate: play.end_date ?? undefined,
    image: play.poster_url ?? undefined,
    description: play.synopsis ?? undefined,
    location: play.venue
      ? { "@type": "Place", name: play.venue.name, address: [play.venue.address, play.venue.city].filter(Boolean).join(", ") }
      : undefined,
    performer: cast.map((c) => ({ "@type": "Person", name: c.name })),
    offers: tiers.map((t) => ({ "@type": "Offer", name: t.tier_name, price: t.price_npr, priceCurrency: "NPR", url: play.booking_url ?? undefined })),
  };

  return (
    <article className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-line sm:w-56">
          <Poster src={play.poster_url} alt={`${play.title} poster`} />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-primary ring-1 ring-line">
              {STATUS_LABEL[play.status] ?? play.status}
            </span>
            <h1 className="mt-2 text-3xl font-bold text-text sm:text-4xl">{play.title}</h1>
            {play.title_ne && <p className="text-lg text-muted">{play.title_ne}</p>}
          </div>

          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ["Venue", play.venue ? `${play.venue.name}, ${play.venue.city}` : "TBA"],
              ["Dates", play.start_date ? `${formatDate(play.start_date)}${play.end_date ? ` – ${formatDate(play.end_date)}` : ""}` : "TBA"],
              ["Show timings", play.show_times ?? "TBA"],
              ["Duration", play.duration_minutes ? `${play.duration_minutes} min` : null],
              ["Language", languageName(play.language)],
              ["Director", play.director],
              ["Playwright", play.playwright],
              ["Theatre group", play.theatre_group],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="text-text">{v}</dd>
                </div>
              ))}
          </dl>

          <div className="flex flex-wrap items-center gap-4">
            <BookButton href={play.booking_url} label="Book Seats" />
            {play.community_rating != null && (
              <span className="text-sm text-muted">
                <span className="font-bold text-primary">★ {play.community_rating.toFixed(1)}/10</span> from{" "}
                {play.community_rating_count} reviews
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-text">Ticket prices</h2>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted">Pricing not announced yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold text-text">{t.tier_name}</td>
                    <td className="px-4 py-3 text-muted">{t.description ?? ""}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{npr(t.price_npr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {play.synopsis && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-text">About the play</h2>
          <p className="max-w-3xl leading-7 text-muted">{play.synopsis}</p>
        </section>
      )}

      {cast.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-text">Cast</h2>
          <ul className="flex flex-wrap gap-2">
            {cast.map((c) => (
              <li key={`${c.name}-${c.role ?? ""}`} className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line">
                <span className="font-medium text-text">{c.name}</span>
                {c.role && <span className="text-muted"> as {c.role}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Reviews kind="play" id={play.id} initial={reviews} />
    </article>
  );
}
