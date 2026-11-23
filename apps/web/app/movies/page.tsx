import type { Metadata } from "next";

import { MovieBrowser } from "@/components/MovieBrowser";
import { getMovies } from "@/lib/data";

export const metadata: Metadata = {
  title: "Movies in Nepal — Now Showing, Pre-Booking & Upcoming",
  description:
    "Nepali, Hindi and English movies in Nepal cinemas: now showing, pre-booking and upcoming releases with IMDb, Rotten Tomatoes and Mancha ratings.",
  alternates: { canonical: "/movies/" },
};

export default async function MoviesPage() {
  const movies = await getMovies();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">Movies</h1>
        <p className="mt-1 text-muted">Now Showing, Pre-Booking and Upcoming across Nepal.</p>
      </div>
      <MovieBrowser movies={movies} />
    </div>
  );
}
