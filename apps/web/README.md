# Mancha Web (`apps/web`)

Next.js (App Router, TypeScript, Tailwind CSS v4), statically exported for **Cloudflare Pages**.

## Local

```bash
cp .env.example .env.local   # Supabase URL + anon key
npm install
npm run dev
```

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Root directory | `apps/web` |
| Build command | `npm run build` |
| Output directory | `out` |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` |

Pages are generated from Supabase at build time (SEO metadata, JSON-LD, sitemap). Reviews also refresh live in the browser.
Trigger a rebuild (Cloudflare deploy hook) after each sync to pick up new movies.

## Routes

- `/` — Now Showing, Live Theatre, Upcoming Events
- `/movies/` and `/movies/[id]/` — filters, IMDb/RT/TMDB + Mancha rating, Box Office NPR, Book Ticket, spoiler-blurred reviews
- `/stage/` and `/stage/[id]/` — venue, cast, timings, tiered NPR pricing, Book Seats
- `/events/` — performers, Free/NPR badge, ticket links
