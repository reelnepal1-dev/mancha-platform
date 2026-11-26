#!/usr/bin/env python3
"""
Mancha — TMDB + OMDb movie sync.

1. Discover Nepali (ne), Hindi (hi) and English (en) movies released in the
   last 60 days or releasing in the next 90 days (TMDB /discover/movie).
2. Fetch full details (imdb_id, runtime, overview, YouTube trailer, images).
3. Upsert into `movies` on tmdb_id, preserving manual edits:
   box_office_npr, booking_url, and an existing spoiler-free synopsis.
4. Upsert TMDB + OMDb (IMDb, Rotten Tomatoes, Metacritic) scores into
   `movie_external_ratings`.

Env: SUPABASE_URL, SUPABASE_SECRET_KEY, TMDB_API_KEY, OMDB_API_KEY
"""
from __future__ import annotations

import logging
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).with_name(".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mancha-sync")

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG = "https://image.tmdb.org/t/p"
OMDB_BASE = "https://www.omdbapi.com/"

LANGUAGES = ["ne", "hi", "en"]
PAST_DAYS = 60
FUTURE_DAYS = 90
# English has far more titles than Nepali/Hindi; cap pages per language.
MAX_PAGES = {"ne": 10, "hi": 5, "en": 5}
REQUEST_TIMEOUT = 20

# Movie statuses a human may set that the sync must not overwrite
# (e.g. a cinema has opened pre-booking, or an editor archived it).
MANUAL_STATUSES = {"pre_booking", "archived"}


def env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        log.error("Missing required environment variable %s", name)
        sys.exit(1)
    return value


def normalize_supabase_url(raw: str) -> str:
    """Keep only scheme://host so a pasted REST URL (…/rest/v1/) or a trailing
    slash or stray whitespace in the secret can't break PostgREST paths."""
    from urllib.parse import urlparse

    value = raw.strip().strip('"').strip("'")
    if "://" not in value:
        value = "https://" + value
    parsed = urlparse(value)
    if not parsed.netloc:
        log.error("SUPABASE_URL is not a valid URL")
        sys.exit(1)
    return f"{parsed.scheme or 'https'}://{parsed.netloc}"


SUPABASE_URL = normalize_supabase_url(env("SUPABASE_URL"))
SUPABASE_SECRET_KEY = env("SUPABASE_SECRET_KEY")
TMDB_API_KEY = env("TMDB_API_KEY")
OMDB_API_KEY = os.getenv("OMDB_API_KEY", "")

session = requests.Session()
session.headers.update({"Accept": "application/json", "User-Agent": "mancha-sync/1.0"})


# --------------------------------------------------------------------------
# HTTP helpers
# --------------------------------------------------------------------------
def get_json(url: str, params: dict[str, Any], retries: int = 3) -> dict[str, Any] | None:
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", "2"))
                log.warning("Rate limited by %s, sleeping %ss", url, wait)
                time.sleep(wait)
                continue
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            log.warning("Request failed (%s/%s) %s: %s", attempt, retries, url, exc)
            time.sleep(attempt * 2)
    return None


def tmdb(path: str, **params: Any) -> dict[str, Any] | None:
    return get_json(f"{TMDB_BASE}{path}", {"api_key": TMDB_API_KEY, **params})


# --------------------------------------------------------------------------
# TMDB
# --------------------------------------------------------------------------
def discover_ids(lang: str, start: date, end: date) -> list[int]:
    ids: list[int] = []
    page, total_pages = 1, 1
    while page <= min(total_pages, MAX_PAGES.get(lang, 5)):
        data = tmdb(
            "/discover/movie",
            with_original_language=lang,
            **{
                "primary_release_date.gte": start.isoformat(),
                "primary_release_date.lte": end.isoformat(),
            },
            sort_by="popularity.desc",
            include_adult="false",
            page=page,
        )
        if not data:
            break
        total_pages = data.get("total_pages", 1)
        ids.extend(m["id"] for m in data.get("results", []) if m.get("id"))
        page += 1
    log.info("Discovered %d %s movies", len(ids), lang)
    return ids


def pick_trailer(videos: dict[str, Any] | None) -> str | None:
    results = (videos or {}).get("results", [])
    yt = [v for v in results if v.get("site") == "YouTube" and v.get("key")]
    for pred in (
        lambda v: v.get("type") == "Trailer" and v.get("official"),
        lambda v: v.get("type") == "Trailer",
        lambda v: v.get("type") == "Teaser",
    ):
        match = next((v for v in yt if pred(v)), None)
        if match:
            return f"https://www.youtube.com/watch?v={match['key']}"
    return None


def image(path: str | None, size: str) -> str | None:
    return f"{TMDB_IMG}/{size}{path}" if path else None


def parse_date(value: str | None) -> date | None:
    try:
        return date.fromisoformat(value) if value else None
    except ValueError:
        return None


def map_movie(d: dict[str, Any], today: date) -> dict[str, Any]:
    release = parse_date(d.get("release_date"))
    spoken = [l.get("iso_639_1") for l in d.get("spoken_languages", []) if l.get("iso_639_1")]
    original = d.get("original_language")
    languages = list(dict.fromkeys(([original] if original else []) + spoken))

    return {
        "tmdb_id": d["id"],
        "imdb_id": d.get("imdb_id") or None,
        "title": d.get("title") or d.get("original_title"),
        "original_language": original,
        "languages": languages,
        "synopsis": (d.get("overview") or "").strip() or None,
        "genres": [g["name"] for g in d.get("genres", []) if g.get("name")],
        "runtime_minutes": d.get("runtime") or None,
        "release_date_np": release.isoformat() if release else None,
        "status": "upcoming" if (release is None or release > today) else "now_showing",
        "poster_url": image(d.get("poster_path"), "w500"),
        "backdrop_url": image(d.get("backdrop_path"), "w1280"),
        "trailer_url": pick_trailer(d.get("videos")),
        "last_synced_at": datetime.now(timezone.utc).isoformat(),
    }


# --------------------------------------------------------------------------
# OMDb
# --------------------------------------------------------------------------
def parse_number(text: str | None) -> float | None:
    if not text:
        return None
    m = re.search(r"[\d.]+", text.replace(",", ""))
    return float(m.group()) if m else None


def omdb_ratings(imdb_id: str) -> list[dict[str, Any]]:
    if not OMDB_API_KEY:
        return []
    data = get_json(OMDB_BASE, {"i": imdb_id, "apikey": OMDB_API_KEY})
    if not data or data.get("Response") != "True":
        return []

    out: list[dict[str, Any]] = []
    for r in data.get("Ratings", []):
        src, val = r.get("Source"), r.get("Value", "")
        if src == "Internet Movie Database":
            out.append({
                "source": "imdb", "score": parse_number(val.split("/")[0]), "max_score": 10,
                "display_value": val, "vote_count": int(parse_number(data.get("imdbVotes")) or 0) or None,
            })
        elif src == "Rotten Tomatoes":
            out.append({"source": "rotten_tomatoes", "score": parse_number(val), "max_score": 100,
                        "display_value": val, "vote_count": None})
        elif src == "Metacritic":
            out.append({"source": "metacritic", "score": parse_number(val.split("/")[0]), "max_score": 100,
                        "display_value": val, "vote_count": None})
    return out


# --------------------------------------------------------------------------
# Supabase
# --------------------------------------------------------------------------
def existing_rows(sb: Client, tmdb_ids: list[int]) -> dict[int, dict[str, Any]]:
    rows: dict[int, dict[str, Any]] = {}
    for i in range(0, len(tmdb_ids), 200):
        chunk = tmdb_ids[i : i + 200]
        res = (
            sb.table("movies")
            .select("id,tmdb_id,synopsis,booking_url,box_office_npr,status")
            .in_("tmdb_id", chunk)
            .execute()
        )
        for r in res.data or []:
            rows[r["tmdb_id"]] = r
    return rows


def preserve_manual(row: dict[str, Any], existing: dict[str, Any] | None) -> dict[str, Any]:
    """Never send manually curated fields when they're already set."""
    # box_office_npr and booking_url are never written by the sync at all.
    row.pop("box_office_npr", None)
    row.pop("booking_url", None)
    if existing:
        if existing.get("synopsis"):
            row.pop("synopsis", None)  # keep the editor's spoiler-free synopsis
        if existing.get("status") in MANUAL_STATUSES:
            row.pop("status", None)
    return row


def main() -> int:
    today = date.today()
    start, end = today - timedelta(days=PAST_DAYS), today + timedelta(days=FUTURE_DAYS)
    log.info("Syncing releases between %s and %s", start, end)

    sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

    tmdb_ids = list(dict.fromkeys(i for lang in LANGUAGES for i in discover_ids(lang, start, end)))
    existing = existing_rows(sb, tmdb_ids)

    synced = rated = failed = 0
    for tmdb_id in tmdb_ids:
        details = tmdb(f"/movie/{tmdb_id}", append_to_response="videos")
        if not details:
            failed += 1
            continue

        row = preserve_manual(map_movie(details, today), existing.get(tmdb_id))
        if not row.get("title"):
            continue

        try:
            res = sb.table("movies").upsert(row, on_conflict="tmdb_id").execute()
        except Exception as exc:  # e.g. duplicate imdb_id on another row
            log.warning("Upsert failed for tmdb_id=%s: %s", tmdb_id, exc)
            failed += 1
            continue
        movie_id = (res.data or [{}])[0].get("id")
        synced += 1
        if not movie_id:
            continue

        ratings: list[dict[str, Any]] = []
        if details.get("vote_count"):
            ratings.append({
                "source": "tmdb", "score": round(float(details.get("vote_average") or 0), 2), "max_score": 10,
                "display_value": f"{details.get('vote_average', 0):.1f}/10", "vote_count": details.get("vote_count"),
            })
        if row.get("imdb_id"):
            ratings.extend(omdb_ratings(row["imdb_id"]))

        if ratings:
            now = datetime.now(timezone.utc).isoformat()
            payload = [{**r, "movie_id": movie_id, "fetched_at": now} for r in ratings if r["score"] is not None]
            try:
                sb.table("movie_external_ratings").upsert(payload, on_conflict="movie_id,source").execute()
                rated += 1
            except Exception as exc:
                log.warning("Ratings upsert failed for %s: %s", movie_id, exc)

    log.info("Done: %d movies upserted, %d with external ratings, %d failed", synced, rated, failed)
    return 0 if synced or not tmdb_ids else 1


if __name__ == "__main__":
    sys.exit(main())
