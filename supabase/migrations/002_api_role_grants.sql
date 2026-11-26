-- 002: table privileges for Supabase API roles.
-- Newer Supabase projects don't auto-grant table access to the Data API roles,
-- so PostgREST returned "permission denied for table movies" (42501).
-- RLS policies from 001 still decide which rows each role can see/change.

grant usage on schema public to anon, authenticated, service_role;

-- Sync job (service_role bypasses RLS)
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Public read (RLS still filters rows)
grant select on all tables in schema public to anon, authenticated;

-- Signed-in users write their own data (RLS enforces ownership)
grant insert, update, delete on public.profiles, public.reviews, public.user_interests to authenticated;

-- Future tables get the same defaults
alter default privileges in schema public grant all    on tables    to service_role;
alter default privileges in schema public grant all    on sequences to service_role;
alter default privileges in schema public grant select on tables    to anon, authenticated;
