-- =====================================================================
-- Mancha (मञ्च) — 001_initial_schema.sql
-- Supabase project: mancha-prod (ap-south-1)
-- Tables: profiles, venues, movies, movie_external_ratings, plays,
--         play_ticket_tiers, events, reviews, user_interests
-- Includes: enums, indexes, updated_at triggers, auto-profile on signup,
--           pre-release detection, rating aggregation triggers
--           (hype vs. post-release kept separate), RLS policies,
--           public storage bucket `media`.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.venue_type     as enum ('cinema', 'theatre', 'event_space', 'outdoor', 'other');
create type public.movie_status   as enum ('upcoming', 'pre_booking', 'now_showing', 'archived');
create type public.play_status    as enum ('upcoming', 'running', 'ended', 'cancelled');
create type public.event_status   as enum ('upcoming', 'ongoing', 'ended', 'cancelled');
create type public.event_category as enum ('concert', 'festival', 'comedy', 'cultural', 'sports', 'workshop', 'other');
create type public.content_type   as enum ('movie', 'play', 'event');
create type public.rating_source  as enum ('imdb', 'rotten_tomatoes', 'metacritic', 'tmdb');
create type public.interest_kind  as enum ('watchlist', 'interested', 'going');

-- ---------------------------------------------------------------------
-- Shared: updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name  text,
  avatar_url    text,
  bio           text check (char_length(bio) <= 300),
  city          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. venues
-- ---------------------------------------------------------------------
create table public.venues (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_ne       text,
  type          public.venue_type not null default 'other',
  address       text,
  city          text not null default 'Kathmandu',
  district      text,
  latitude      double precision,
  longitude     double precision,
  phone         text,
  website_url   text,
  booking_url   text,
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (name, city)
);

create index idx_venues_city on public.venues (city);
create index idx_venues_type on public.venues (type);

create trigger trg_venues_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. movies
-- ---------------------------------------------------------------------
create table public.movies (
  id                      uuid primary key default gen_random_uuid(),
  tmdb_id                 integer unique,
  imdb_id                 text unique,
  title                   text not null,
  title_ne                text,
  original_language       text,                       -- ISO 639-1, e.g. 'ne', 'hi', 'en'
  languages               text[] not null default '{}',
  synopsis                text,                       -- MUST be spoiler-free
  genres                  text[] not null default '{}',
  certification           text,                       -- e.g. 'U', 'PG', 'A'
  runtime_minutes         integer check (runtime_minutes > 0),
  release_date_np         date,                       -- release date in Nepal
  status                  public.movie_status not null default 'upcoming',
  poster_url              text,
  backdrop_url            text,
  trailer_url             text,
  booking_url             text,                       -- external booking redirect
  box_office_npr          bigint check (box_office_npr >= 0),
  box_office_updated_at   timestamptz,
  -- post-release community score (is_pre_release = false)
  community_rating        numeric(4,2),
  community_rating_count  integer not null default 0,
  -- pre-release hype score (is_pre_release = true)
  hype_rating             numeric(4,2),
  hype_rating_count       integer not null default 0,
  last_synced_at          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_movies_status        on public.movies (status);
create index idx_movies_release_date  on public.movies (release_date_np);
create index idx_movies_languages     on public.movies using gin (languages);
create index idx_movies_box_office    on public.movies (box_office_npr desc nulls last);

create trigger trg_movies_updated_at
  before update on public.movies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. movie_external_ratings
-- ---------------------------------------------------------------------
create table public.movie_external_ratings (
  id            uuid primary key default gen_random_uuid(),
  movie_id      uuid not null references public.movies(id) on delete cascade,
  source        public.rating_source not null,
  score         numeric(5,2),                 -- normalized value, e.g. 7.8, 92, 74
  max_score     numeric(5,2) not null,        -- e.g. 10, 100
  display_value text,                         -- as shown by source, e.g. '7.8/10', '92%'
  vote_count    integer,
  fetched_at    timestamptz not null default now(),
  unique (movie_id, source)
);

create index idx_mer_movie on public.movie_external_ratings (movie_id);

-- ---------------------------------------------------------------------
-- 5. plays
-- ---------------------------------------------------------------------
create table public.plays (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null,
  title_ne                text,
  synopsis                text,               -- MUST be spoiler-free
  language                text not null default 'ne',
  genres                  text[] not null default '{}',
  director                text,
  playwright              text,
  theatre_group           text,
  cast_members            jsonb not null default '[]'::jsonb,  -- [{ "name": "", "role": "" }]
  venue_id                uuid references public.venues(id) on delete set null,
  start_date              date,
  end_date                date,
  show_times              text,               -- e.g. 'Daily 5:00 PM, Sat 1:00 PM'
  duration_minutes        integer check (duration_minutes > 0),
  status                  public.play_status not null default 'upcoming',
  poster_url              text,
  booking_url             text,               -- external booking redirect
  community_rating        numeric(4,2),
  community_rating_count  integer not null default 0,
  hype_rating             numeric(4,2),
  hype_rating_count       integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index idx_plays_status on public.plays (status);
create index idx_plays_venue  on public.plays (venue_id);
create index idx_plays_dates  on public.plays (start_date, end_date);

create trigger trg_plays_updated_at
  before update on public.plays
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. play_ticket_tiers
-- ---------------------------------------------------------------------
create table public.play_ticket_tiers (
  id            uuid primary key default gen_random_uuid(),
  play_id       uuid not null references public.plays(id) on delete cascade,
  tier_name     text not null,                -- e.g. 'Balcony', 'Front Row', 'Student'
  price_npr     integer not null check (price_npr >= 0),
  description   text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (play_id, tier_name)
);

create index idx_ptt_play on public.play_ticket_tiers (play_id, sort_order);

-- ---------------------------------------------------------------------
-- 7. events
-- ---------------------------------------------------------------------
create table public.events (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null,
  title_ne                text,
  category                public.event_category not null default 'other',
  description             text,               -- MUST be spoiler-free
  performers              text[] not null default '{}',
  organizer               text,
  venue_id                uuid references public.venues(id) on delete set null,
  starts_at               timestamptz not null,
  ends_at                 timestamptz,
  is_free                 boolean not null default false,
  price_min_npr           integer check (price_min_npr >= 0),
  price_max_npr           integer check (price_max_npr >= 0),
  status                  public.event_status not null default 'upcoming',
  poster_url              text,
  booking_url             text,               -- external booking redirect
  community_rating        numeric(4,2),
  community_rating_count  integer not null default 0,
  hype_rating             numeric(4,2),
  hype_rating_count       integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  check (price_max_npr is null or price_min_npr is null or price_max_npr >= price_min_npr),
  check (not is_free or (coalesce(price_min_npr, 0) = 0 and coalesce(price_max_npr, 0) = 0))
);

create index idx_events_starts_at on public.events (starts_at);
create index idx_events_category  on public.events (category);
create index idx_events_status    on public.events (status);
create index idx_events_venue     on public.events (venue_id);

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. reviews  (one table for movies, plays, and events)
-- ---------------------------------------------------------------------
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  content_type       public.content_type not null,
  movie_id           uuid references public.movies(id) on delete cascade,
  play_id            uuid references public.plays(id)  on delete cascade,
  event_id           uuid references public.events(id) on delete cascade,
  rating             smallint not null check (rating between 1 and 10),
  title              text check (char_length(title) <= 120),
  body               text check (char_length(body) <= 5000),
  contains_spoilers  boolean not null default false,   -- UI MUST blur: "Tap to Reveal Spoiler"
  is_pre_release     boolean not null default false,   -- hype rating; set automatically by trigger
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- exactly one target, matching content_type
  constraint reviews_one_target check (
       (content_type = 'movie' and movie_id is not null and play_id is null and event_id is null)
    or (content_type = 'play'  and play_id  is not null and movie_id is null and event_id is null)
    or (content_type = 'event' and event_id is not null and movie_id is null and play_id is null)
  )
);

-- One hype review + one post-release review per user per item
create unique index uq_reviews_movie on public.reviews (user_id, movie_id, is_pre_release) where movie_id is not null;
create unique index uq_reviews_play  on public.reviews (user_id, play_id,  is_pre_release) where play_id  is not null;
create unique index uq_reviews_event on public.reviews (user_id, event_id, is_pre_release) where event_id is not null;

create index idx_reviews_movie   on public.reviews (movie_id, created_at desc) where movie_id is not null;
create index idx_reviews_play    on public.reviews (play_id,  created_at desc) where play_id  is not null;
create index idx_reviews_event   on public.reviews (event_id, created_at desc) where event_id is not null;
create index idx_reviews_user    on public.reviews (user_id, created_at desc);

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Decide is_pre_release from the item's release/start date (clients cannot fake it)
create or replace function public.set_review_pre_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release timestamptz;
begin
  -- Only decide on insert, or when the target changes; editing a review later keeps its bucket.
  if tg_op = 'UPDATE'
     and new.movie_id is not distinct from old.movie_id
     and new.play_id  is not distinct from old.play_id
     and new.event_id is not distinct from old.event_id then
    new.is_pre_release := old.is_pre_release;
    return new;
  end if;

  if new.content_type = 'movie' then
    select release_date_np::timestamptz into v_release from public.movies where id = new.movie_id;
  elsif new.content_type = 'play' then
    select start_date::timestamptz into v_release from public.plays where id = new.play_id;
  else
    select starts_at into v_release from public.events where id = new.event_id;
  end if;

  -- Unknown date = treat as not yet released (hype)
  new.is_pre_release := (v_release is null or v_release > now());
  return new;
end;
$$;

create trigger trg_reviews_pre_release
  before insert or update on public.reviews
  for each row execute function public.set_review_pre_release();

-- Recompute aggregates for one item. Hype and post-release are kept separate.
create or replace function public.recompute_item_rating(p_type public.content_type, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comm_avg numeric(4,2); v_comm_cnt integer;
  v_hype_avg numeric(4,2); v_hype_cnt integer;
begin
  if p_id is null then return; end if;

  select
    round(avg(rating) filter (where not is_pre_release), 2),
    count(*)          filter (where not is_pre_release),
    round(avg(rating) filter (where is_pre_release), 2),
    count(*)          filter (where is_pre_release)
  into v_comm_avg, v_comm_cnt, v_hype_avg, v_hype_cnt
  from public.reviews
  where (p_type = 'movie' and movie_id = p_id)
     or (p_type = 'play'  and play_id  = p_id)
     or (p_type = 'event' and event_id = p_id);

  if p_type = 'movie' then
    update public.movies set community_rating = v_comm_avg, community_rating_count = v_comm_cnt,
                             hype_rating = v_hype_avg, hype_rating_count = v_hype_cnt
     where id = p_id;
  elsif p_type = 'play' then
    update public.plays  set community_rating = v_comm_avg, community_rating_count = v_comm_cnt,
                             hype_rating = v_hype_avg, hype_rating_count = v_hype_cnt
     where id = p_id;
  else
    update public.events set community_rating = v_comm_avg, community_rating_count = v_comm_cnt,
                             hype_rating = v_hype_avg, hype_rating_count = v_hype_cnt
     where id = p_id;
  end if;
end;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_item_rating(new.content_type, coalesce(new.movie_id, new.play_id, new.event_id));
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recompute_item_rating(old.content_type, coalesce(old.movie_id, old.play_id, old.event_id));
  end if;
  return null;
end;
$$;

create trigger trg_reviews_aggregate
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

revoke execute on function public.recompute_item_rating(public.content_type, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. user_interests  (Watchlist / Interested / Going)
-- ---------------------------------------------------------------------
create table public.user_interests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content_type  public.content_type not null,
  movie_id      uuid references public.movies(id) on delete cascade,
  play_id       uuid references public.plays(id)  on delete cascade,
  event_id      uuid references public.events(id) on delete cascade,
  kind          public.interest_kind not null default 'watchlist',
  created_at    timestamptz not null default now(),
  constraint user_interests_one_target check (
       (content_type = 'movie' and movie_id is not null and play_id is null and event_id is null)
    or (content_type = 'play'  and play_id  is not null and movie_id is null and event_id is null)
    or (content_type = 'event' and event_id is not null and movie_id is null and play_id is null)
  )
);

create unique index uq_ui_movie on public.user_interests (user_id, movie_id, kind) where movie_id is not null;
create unique index uq_ui_play  on public.user_interests (user_id, play_id,  kind) where play_id  is not null;
create unique index uq_ui_event on public.user_interests (user_id, event_id, kind) where event_id is not null;
create index idx_ui_user on public.user_interests (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
-- Catalog tables: public read; writes only via service_role (sync scripts / admin),
-- which bypasses RLS. No insert/update/delete policies = denied for anon/authenticated.
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.venues                 enable row level security;
alter table public.movies                 enable row level security;
alter table public.movie_external_ratings enable row level security;
alter table public.plays                  enable row level security;
alter table public.play_ticket_tiers      enable row level security;
alter table public.events                 enable row level security;
alter table public.reviews                enable row level security;
alter table public.user_interests         enable row level security;

-- Catalog: read for everyone
create policy "venues are public"                 on public.venues                 for select using (true);
create policy "movies are public"                 on public.movies                 for select using (true);
create policy "external ratings are public"       on public.movie_external_ratings for select using (true);
create policy "plays are public"                  on public.plays                  for select using (true);
create policy "ticket tiers are public"           on public.play_ticket_tiers      for select using (true);
create policy "events are public"                 on public.events                 for select using (true);

-- Profiles: public read, owner update
create policy "profiles are public"               on public.profiles for select using (true);
create policy "users update own profile"          on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Reviews: public read, owner write
create policy "reviews are public"                on public.reviews for select using (true);
create policy "users insert own reviews"          on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users update own reviews"          on public.reviews for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own reviews"          on public.reviews for delete to authenticated
  using (auth.uid() = user_id);

-- User interests: private to owner
create policy "users read own interests"          on public.user_interests for select to authenticated
  using (auth.uid() = user_id);
create policy "users insert own interests"        on public.user_interests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users delete own interests"        on public.user_interests for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Storage: public bucket `media` (posters, avatars, venue images)
-- Reads are public; uploads limited to the user's own folder: media/<uid>/...
-- Catalog images are uploaded by service_role (bypasses RLS).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create policy "media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "users upload to own media folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner = auth.uid());

create policy "users delete own media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and owner = auth.uid());
