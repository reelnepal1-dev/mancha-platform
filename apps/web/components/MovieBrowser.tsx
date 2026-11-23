"use client";

import { useMemo, useState } from "react";

import { languageName, STATUS_LABEL } from "@/lib/format";
import type { Movie } from "@/lib/types";

import { MovieCard } from "./MovieCard";

const STATUSES = ["all", "now_showing", "pre_booking", "upcoming"] as const;

export function MovieBrowser({ movies }: { movies: Movie[] }) {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [lang, setLang] = useState("all");

  const languages = useMemo(
    () => Array.from(new Set(movies.map((m) => m.original_language).filter(Boolean) as string[])),
    [movies],
  );

  const filtered = movies.filter(
    (m) => (status === "all" || m.status === status) && (lang === "all" || m.original_language === lang),
  );

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
      active ? "bg-primary text-text ring-primary" : "text-muted ring-line hover:text-text"
    }`;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button key={s} className={chip(status === s)} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by language">
            <button className={chip(lang === "all")} onClick={() => setLang("all")}>
              All languages
            </button>
            {languages.map((l) => (
              <button key={l} className={chip(lang === l)} onClick={() => setLang(l)}>
                {languageName(l)}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted ring-1 ring-line">No movies match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
