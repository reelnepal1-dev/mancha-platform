import type { Metadata } from "next";

import { EventCard } from "@/components/EventCard";
import { getUpcomingEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Upcoming Concerts, Festivals & Comedy Shows in Nepal",
  description:
    "Concerts, festivals, comedy nights and cultural events coming up in Kathmandu and across Nepal — performers, free or NPR prices, and ticket links.",
  alternates: { canonical: "/events/" },
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.slice(0, 30).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: e.title,
        startDate: e.starts_at,
        endDate: e.ends_at ?? undefined,
        image: e.poster_url ?? undefined,
        isAccessibleForFree: e.is_free,
        location: e.venue ? { "@type": "Place", name: e.venue.name, address: e.venue.city } : undefined,
        performer: e.performers.map((p) => ({ "@type": "PerformingGroup", name: p })),
        offers:
          !e.is_free && e.price_min_npr != null
            ? { "@type": "Offer", price: e.price_min_npr, priceCurrency: "NPR", url: e.booking_url ?? undefined }
            : undefined,
      },
    })),
  };

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div>
        <h1 className="text-3xl font-bold text-text">Events</h1>
        <p className="mt-1 text-muted">Concerts, festivals and comedy shows coming up in Nepal.</p>
      </div>
      {events.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted ring-1 ring-line">No upcoming events listed yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
