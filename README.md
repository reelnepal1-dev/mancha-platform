# Mancha (मञ्च)

Nepal's unified entertainment discovery & community rating app — Movies, Live Theatre, and Events.

See **[PROJECT_BRIEF.md](./PROJECT_BRIEF.md)** for the rules, stack, and design system.

| Path | What |
|---|---|
| `apps/mobile` | Expo React Native (TypeScript, Expo Router, NativeWind) |
| `apps/web` | Next.js on Cloudflare Pages (planned) |
| `supabase/migrations` | Postgres schema, triggers, RLS |
| `scripts/sync` | TMDB / OMDb sync via GitHub Actions (planned) |

## Mobile quick start

```bash
cd apps/mobile
cp .env.example .env.local   # add Supabase URL + anon key
npm install
npx expo start
```

## Database

Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor for `mancha-prod`, or `supabase db push` with the CLI.
