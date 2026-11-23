import type { MetadataRoute } from "next";

import { getMovies, getPlays } from "@/lib/data";
import { SITE_URL } from "@/lib/format";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [movies, plays] = await Promise.all([getMovies(1000), getPlays()]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/movies/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/stage/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/events/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...movies.map((m) => ({ url: `${SITE_URL}/movies/${m.id}/`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...plays.map((p) => ({ url: `${SITE_URL}/stage/${p.id}/`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
