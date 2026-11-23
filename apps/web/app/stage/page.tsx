import type { Metadata } from "next";

import { PlayCard } from "@/components/PlayCard";
import { getPlays } from "@/lib/data";

export const metadata: Metadata = {
  title: "Live Theatre Plays in Kathmandu & Nepal",
  description:
    "Theatre plays running now and opening soon in Nepal — venues, cast, show timings, NPR ticket prices and booking links.",
  alternates: { canonical: "/stage/" },
};

export default async function StagePage() {
  const plays = await getPlays();
  const running = plays.filter((p) => p.status === "running");
  const upcoming = plays.filter((p) => p.status === "upcoming");

  const grid = (list: typeof plays) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {list.map((p) => (
        <PlayCard key={p.id} play={p} />
      ))}
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-text">Stage</h1>
        <p className="mt-1 text-muted">Live theatre across Nepal.</p>
      </div>
      {plays.length === 0 && (
        <p className="rounded-xl bg-card p-6 text-sm text-muted ring-1 ring-line">No plays listed yet. Check back soon.</p>
      )}
      {running.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text">Running Now</h2>
          {grid(running)}
        </section>
      )}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text">Opening Soon</h2>
          {grid(upcoming)}
        </section>
      )}
    </div>
  );
}
