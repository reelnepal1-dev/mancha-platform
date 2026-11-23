import type { Metadata } from "next";

import { EventCard } from "@/components/EventCard";
import { MovieCard } from "@/components/MovieCard";
import { PlayCard } from "@/components/PlayCard";
import { Section } from "@/components/Section";
import { getMovies, getPlays, getUpcomingEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Mancha (मञ्च) — What's On in Nepal: Movies, Theatre & Events" },
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [movies, plays, events] = await Promise.all([getMovies(), getPlays(), getUpcomingEvents(6)]);
  const nowShowing = movies.filter((m) => m.status === "now_showing").slice(0, 10);

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text sm:text-4xl">
          What&apos;s on in Nepal <span className="text-primary">tonight</span>
        </h1>
        <p className="max-w-2xl text-muted">
          Movies in cinemas, live theatre, and the concerts and festivals worth leaving the house for. Spoiler-free,
          rated by the community.
        </p>
      </div>

      <Section title="Now Showing" href="/movies/" empty={nowShowing.length === 0}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {nowShowing.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </Section>

      <Section title="Live Theatre" href="/stage/" empty={plays.length === 0}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {plays.slice(0, 5).map((p) => (
            <PlayCard key={p.id} play={p} />
          ))}
        </div>
      </Section>

      <Section title="Upcoming Events" href="/events/" empty={events.length === 0}>
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </Section>
    </div>
  );
}
