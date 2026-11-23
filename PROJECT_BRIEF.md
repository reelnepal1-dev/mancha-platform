# Mancha (मञ्च) — Project Brief

Nepal's unified entertainment discovery & community rating app for **Movies**, **Live Theatre Plays**, and **Events/Festivals**, on Mobile (Android APK / iOS) and Web.

Repository: `github.com/reelnepal1-dev/mancha-platform` — branch `main`.

---

## 1. Mandatory Git Rule

- **ALL** code, SQL, and `.env.example` files **MUST** stay inside this repo.
- Real secrets (`.env`, `.env.local`, service-role keys) are **never** committed — only `.env.example` templates.
- Before finishing **ANY** task, **ALWAYS** run, in order:

  ```bash
  git status
  git add -A
  git commit -m "<summary>"
  git push origin main
  ```

- Then **report the commit hash + the list of files changed**.

---

## 2. Stack ($0/month)

| Layer | Choice | Notes |
|---|---|---|
| Backend / DB / Auth | **Supabase** | Project `mancha-prod`, region Mumbai `ap-south-1`, public storage bucket `media` |
| Mobile | `apps/mobile` | Expo React Native, TypeScript, Expo Router, NativeWind |
| Web | `apps/web` | Next.js, deployed on Cloudflare Pages |
| Auto-sync | `scripts/sync` | Python + GitHub Actions, pulling from TMDB & OMDb APIs |

Database migrations live in `supabase/migrations/` and are numbered (`001_…`, `002_…`).

---

## 3. Design System (Dark Mode)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0D1117` | App background |
| `card` | `#161B22` | Cards, sheets, tab bar |
| `primary` | `#2A9D8F` | Primary actions, active tab, highlights |
| `ticket` | `#E76F51` | Ticket / booking CTA buttons **only** |
| `text` | `#F8F9FA` | Primary text |
| `muted` | `#94A3B8` | Secondary text, captions |

---

## 4. Navigation — 4 Bottom Tabs

1. **Movies**
   - Now Showing, Pre-Booking, Upcoming
   - Language filter (Nepali, Hindi, English, etc.)
   - Box Office (NPR)
   - External booking redirect (opens the cinema's / ticketing partner's page)
2. **Stage**
   - Theatre plays with venue, cast, show dates
   - Tiered NPR pricing (from `play_ticket_tiers`)
   - External booking redirect
3. **Events**
   - Concerts, festivals, cultural events
   - Performers, venue, dates
   - Free / Paid badge
   - External booking redirect
4. **Profile**
   - Watchlist
   - My Reviews

---

## 5. Strict Content Rules

1. **Spoiler-free synopses only.** Every synopsis (movie, play, event) must be spoiler-free. Synced synopses must be reviewed/trimmed if needed.
2. **Spoiler reviews are blurred.** Any review with `contains_spoilers = true` **MUST** render blurred behind a **"Tap to Reveal Spoiler"** toggle. Never show it in plain text by default — on any platform.
3. **Hype vs. real scores are separate.** Reviews with `is_pre_release = true` are **hype ratings** and are aggregated separately from post-release scores. They must never be mixed into the main community score.
