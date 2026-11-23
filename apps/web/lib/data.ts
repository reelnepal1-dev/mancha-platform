import { supabase } from "./supabase";
import type { EventItem, Movie, Play, Review } from "./types";

// All fetchers degrade to empty results so the static build never fails
// when Supabase is unreachable or env vars are missing.

const MOVIE_FIELDS =
  "id,title,title_ne,original_language,languages,synopsis,genres,certification,runtime_minutes,release_date_np,status,poster_url,backdrop_url,trailer_url,booking_url,box_office_npr,community_rating,community_rating_count,hype_rating,hype_rating_count";

export async function getMovies(limit = 200): Promise<Movie[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("movies")
    .select(`${MOVIE_FIELDS},movie_external_ratings(source,score,max_score,display_value)`)
    .neq("status", "archived")
    .order("release_date_np", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) console.warn("getMovies:", error.message);
  return (data as Movie[] | null) ?? [];
}

export async function getMovie(id: string): Promise<Movie | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("movies")
    .select(`${MOVIE_FIELDS},movie_external_ratings(source,score,max_score,display_value)`)
    .eq("id", id)
    .maybeSingle();
  return (data as Movie | null) ?? null;
}

const PLAY_FIELDS =
  "id,title,title_ne,synopsis,language,director,playwright,theatre_group,cast_members,start_date,end_date,show_times,duration_minutes,status,poster_url,booking_url,community_rating,community_rating_count,hype_rating,hype_rating_count,venue:venues(id,name,address,city)";

export async function getPlays(): Promise<Play[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("plays")
    .select(`${PLAY_FIELDS},play_ticket_tiers(id,tier_name,price_npr,description,sort_order)`)
    .in("status", ["running", "upcoming"])
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) console.warn("getPlays:", error.message);
  return (data as unknown as Play[] | null) ?? [];
}

export async function getPlay(id: string): Promise<Play | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("plays")
    .select(`${PLAY_FIELDS},play_ticket_tiers(id,tier_name,price_npr,description,sort_order)`)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Play | null) ?? null;
}

export async function getUpcomingEvents(limit = 100): Promise<EventItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("events")
    .select(
      "id,title,category,description,performers,starts_at,ends_at,is_free,price_min_npr,price_max_npr,poster_url,booking_url,venue:venues(id,name,address,city)",
    )
    .in("status", ["upcoming", "ongoing"])
    .gte("starts_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
  if (error) console.warn("getUpcomingEvents:", error.message);
  return (data as unknown as EventItem[] | null) ?? [];
}

export async function getReviews(kind: "movie" | "play" | "event", id: string): Promise<Review[]> {
  if (!supabase) return [];
  const column = `${kind}_id`;
  const { data } = await supabase
    .from("reviews")
    .select("id,rating,title,body,contains_spoilers,is_pre_release,created_at,profiles(username,display_name)")
    .eq(column, id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as unknown as Review[] | null) ?? [];
}
