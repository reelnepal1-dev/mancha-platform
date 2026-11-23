export type MovieStatus = "upcoming" | "pre_booking" | "now_showing" | "archived";

export type ExternalRating = {
  source: "imdb" | "rotten_tomatoes" | "metacritic" | "tmdb";
  score: number | null;
  max_score: number;
  display_value: string | null;
};

export type Movie = {
  id: string;
  title: string;
  title_ne: string | null;
  original_language: string | null;
  languages: string[];
  synopsis: string | null;
  genres: string[];
  certification: string | null;
  runtime_minutes: number | null;
  release_date_np: string | null;
  status: MovieStatus;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  booking_url: string | null;
  box_office_npr: number | null;
  community_rating: number | null;
  community_rating_count: number;
  hype_rating: number | null;
  hype_rating_count: number;
  movie_external_ratings?: ExternalRating[];
};

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string;
};

export type TicketTier = {
  id: string;
  tier_name: string;
  price_npr: number;
  description: string | null;
  sort_order: number;
};

export type CastMember = { name: string; role?: string };

export type Play = {
  id: string;
  title: string;
  title_ne: string | null;
  synopsis: string | null;
  language: string;
  director: string | null;
  playwright: string | null;
  theatre_group: string | null;
  cast_members: CastMember[];
  start_date: string | null;
  end_date: string | null;
  show_times: string | null;
  duration_minutes: number | null;
  status: "upcoming" | "running" | "ended" | "cancelled";
  poster_url: string | null;
  booking_url: string | null;
  community_rating: number | null;
  community_rating_count: number;
  hype_rating: number | null;
  hype_rating_count: number;
  venue: Venue | null;
  play_ticket_tiers?: TicketTier[];
};

export type EventItem = {
  id: string;
  title: string;
  category: "concert" | "festival" | "comedy" | "cultural" | "sports" | "workshop" | "other";
  description: string | null;
  performers: string[];
  starts_at: string;
  ends_at: string | null;
  is_free: boolean;
  price_min_npr: number | null;
  price_max_npr: number | null;
  poster_url: string | null;
  booking_url: string | null;
  venue: Venue | null;
};

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  contains_spoilers: boolean;
  is_pre_release: boolean;
  created_at: string;
  profiles: { username: string | null; display_name: string | null } | null;
};
