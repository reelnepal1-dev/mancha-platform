-- =====================================================================
-- Mancha seed: Stage tab — real Kathmandu plays, late Nov / Dec 2026
-- Verified 2026-11-24 against organiser / ticketing pages:
--   * Bir Ganeshman   — thuprai.com/event/drama-bir-ganeshman/
--   * Nilo Sindur     — bookings.mandalatheatre.com/view-drama/nilo-sindur
--   * Naurangi Danphe — bookings.mandalatheatre.com/view-drama/naurangi-danphe
--   * ४ला४ (4 La 4)   — ticketsanjal.com/events/309
-- Synopses are written spoiler-free (no endings, no twists).
--
-- Run AFTER supabase/migrations/001_initial_schema.sql, in the SQL Editor.
-- Idempotent: safe to run more than once (venues upsert, plays insert
-- only if a play with the same title at the same venue doesn't exist).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Venues
-- ---------------------------------------------------------------------
insert into public.venues
  (name, name_ne, type, address, city, district, latitude, longitude, website_url, booking_url)
values
  ('Sarwanam Theatre', 'सर्वनाम थिएटर', 'theatre',
   'Kalika Marg, Kalikasthan', 'Kathmandu', 'Kathmandu',
   27.70190206924459, 85.32525734468209, null, null),
  ('Mandala Theatre', 'मण्डला थिएटर', 'theatre',
   'Lakhechaur Marga, Thapagaun, New Baneshwor (near Vedanta School)', 'Kathmandu', 'Kathmandu',
   27.693378, 85.3327286, 'https://www.mandalatheatre.com/', 'https://bookings.mandalatheatre.com/'),
  ('Eden Amphitheater', 'इडेन एम्फीथिएटर', 'theatre',
   'Eden, Sanepa', 'Lalitpur', 'Lalitpur',
   27.68184, 85.305738, null, null)
on conflict (name, city) do update
  set name_ne     = excluded.name_ne,
      type        = excluded.type,
      address     = excluded.address,
      district    = excluded.district,
      latitude    = excluded.latitude,
      longitude   = excluded.longitude,
      website_url = coalesce(excluded.website_url, public.venues.website_url),
      booking_url = coalesce(excluded.booking_url, public.venues.booking_url);

-- ---------------------------------------------------------------------
-- Plays
-- ---------------------------------------------------------------------

-- 1) Bir Ganeshman — Sarwanam Theatre
insert into public.plays
  (title, title_ne, synopsis, language, genres, playwright, director, theatre_group,
   venue_id, start_date, end_date, show_times, status, poster_url, booking_url)
select
  'Bir Ganeshman', 'वीर गणेशमान',
  'A biographical drama tracing the life, struggles and unbending spirit of Ganesh Man Singh, '
  || 'one of the towering figures of Nepal''s democratic movement. Sarwanam Theatre brings the '
  || 'man behind the legend to an intimate stage, following the convictions that shaped him '
  || 'and the era he fought to change.',
  'ne', array['Biographical','Historical','Drama'], null, null, 'Sarwanam Theatre',
  v.id, date '2026-08-30', date '2026-12-05',
  'Daily 5:15 PM except Thursday (gate opens 5:00 PM); extra Saturday show 1:00 PM',
  'running',
  'https://media.thuprai.com/__sized__/event/featured_image/drama-bir-ganeshman_quU4G2J-crop-c0-5__0-5-1200x630-70.jpg',
  'https://thuprai.com/event/drama-bir-ganeshman/'
from public.venues v
where v.name = 'Sarwanam Theatre' and v.city = 'Kathmandu'
  and not exists (select 1 from public.plays p where p.title = 'Bir Ganeshman' and p.venue_id = v.id);

-- 2) Nilo Sindur (Neelo Sindoor) — Mandala Theatre
insert into public.plays
  (title, title_ne, synopsis, language, genres, playwright, director, theatre_group,
   venue_id, start_date, end_date, show_times, duration_minutes, status, poster_url, booking_url)
select
  'Nilo Sindur', 'निलो सिन्दुर',
  'A Nepali adaptation of Mahendra Malangia''s celebrated Maithili social drama "Dehpar Kothi '
  || 'Khasadiya" (translated by Dhirendra Premarshi). An ordinary family is put under pressure by '
  || 'poverty, greed, social standing and personal ambition, and the play watches what that '
  || 'pressure does to the people inside it. Realistic dialogue and close-up emotional conflict '
  || 'raise questions about family, inequality and what we value most. Previously staged at the '
  || 'Malangia festival in Delhi.',
  'ne', array['Social Drama','Adaptation'],
  'Mahendra Malangia (Nepali translation: Dhirendra Premarshi)',
  'Rambhajan Kamat & Pushparaj Awasthi',
  'Rangasutra Nepal & Hills Home Theatre',
  v.id, date '2026-11-27', date '2026-12-13',
  'Daily 5:00 PM except Monday',
  80, 'upcoming',
  'https://bookings.mandalatheatre.com/show-images/UJzRPPZYez8sB32fvnfLJPvg81BsjqYGsFr6u2Q8.jpg',
  'https://bookings.mandalatheatre.com/view-drama/nilo-sindur'
from public.venues v
where v.name = 'Mandala Theatre' and v.city = 'Kathmandu'
  and not exists (select 1 from public.plays p where p.title = 'Nilo Sindur' and p.venue_id = v.id);

-- 3) Naurangi Danphe — Mandala Theatre (improv)
insert into public.plays
  (title, title_ne, synopsis, language, genres, playwright, director, theatre_group,
   venue_id, start_date, end_date, show_times, status, poster_url, booking_url)
select
  'Naurangi Danphe', 'नौरंगी डाँफे',
  'An Armando-style improv show performed by artists with intellectual disabilities, where the '
  || 'audience makes the choices and co-writes the evening. Nothing is scripted, so no two shows '
  || 'are ever the same, billed as the first show of its kind in Nepal.',
  'ne', array['Improv','Comedy'], null, 'Nawarash Ghimire', 'Legacy Crown Studios',
  v.id, date '2026-12-11', date '2026-12-13',
  'Fri–Sun 4:00 PM; extra Saturday show 12:00 PM',
  'upcoming',
  'https://bookings.mandalatheatre.com/show-images/eWwmH0gUx5n3wCtsajSjBp90KzAHEmAz59jCXOdW.jpg',
  'https://bookings.mandalatheatre.com/view-drama/naurangi-danphe'
from public.venues v
where v.name = 'Mandala Theatre' and v.city = 'Kathmandu'
  and not exists (select 1 from public.plays p where p.title = 'Naurangi Danphe' and p.venue_id = v.id);

-- 4) ४ला४ 'An Original Play' — Eden Amphitheater
insert into public.plays
  (title, title_ne, synopsis, language, genres, theatre_group,
   venue_id, start_date, end_date, show_times, status, poster_url, booking_url)
select
  '4 La 4: An Original Play', '४ला४',
  'An original open-air comedy-drama built around one premise: when there''s no tomorrow, '
  || 'today gets interesting. Staged under the sky at Eden Amphitheater in Sanepa, it promises '
  || 'that the end of the world was never this much fun.',
  'ne', array['Original','Comedy','Drama'], 'Vida Events',
  v.id, date '2026-11-26', date '2026-11-29',
  'Thu & Fri 6:30 PM; Sat & Sun 1:30 PM and 6:30 PM',
  'upcoming',
  'https://cdn.ticketsanjal.com/images/2026/10/25/051156-Drama%20Ticket%20(2)-500*500.jpeg',
  'https://ticketsanjal.com/events/309'
from public.venues v
where v.name = 'Eden Amphitheater' and v.city = 'Lalitpur'
  and not exists (select 1 from public.plays p where p.title = '4 La 4: An Original Play' and p.venue_id = v.id);

-- ---------------------------------------------------------------------
-- Ticket tiers (only prices confirmed on the booking pages)
-- ---------------------------------------------------------------------
insert into public.play_ticket_tiers (play_id, tier_name, price_npr, description, sort_order)
select p.id, t.tier_name, t.price_npr, t.description, t.sort_order
from (values
  ('Bir Ganeshman',            'General', 300, 'Thuprai',                     0),
  ('Naurangi Danphe',          'General', 500, 'Mandala Theatre booking site', 0),
  ('4 La 4: An Original Play', 'General', 356, 'Ticket Sanjal (as listed)',   0)
) as t(title, tier_name, price_npr, description, sort_order)
join public.plays p on p.title = t.title
on conflict (play_id, tier_name) do update
  set price_npr   = excluded.price_npr,
      description = excluded.description;

commit;
