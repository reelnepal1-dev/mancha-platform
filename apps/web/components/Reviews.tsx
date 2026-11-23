"use client";

import { useEffect, useState } from "react";

import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Review } from "@/lib/types";

import { SpoilerText } from "./SpoilerText";

type Props = { kind: "movie" | "play" | "event"; id: string; initial: Review[] };

/** Renders build-time reviews immediately, then refreshes live from Supabase. */
export function Reviews({ kind, id, initial }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initial);
  const [tab, setTab] = useState<"post" | "hype">("post");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("reviews")
      .select("id,rating,title,body,contains_spoilers,is_pre_release,created_at,profiles(username,display_name)")
      .eq(`${kind}_id`, id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => data && setReviews(data as unknown as Review[]));
  }, [kind, id]);

  // Hype (pre-release) and post-release reviews are always kept apart.
  const post = reviews.filter((r) => !r.is_pre_release);
  const hype = reviews.filter((r) => r.is_pre_release);
  const list = tab === "post" ? post : hype;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-xl font-bold text-text">Reviews</h2>
        {(
          [
            ["post", `Audience (${post.length})`],
            ["hype", `Pre-release hype (${hype.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
              tab === key ? "bg-primary text-text ring-primary" : "text-muted ring-line hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted ring-1 ring-line">
          {tab === "post" ? "No audience reviews yet. Be the first on the Mancha app." : "No hype ratings yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className="space-y-2 rounded-xl bg-card p-4 ring-1 ring-line">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text">
                  {r.profiles?.display_name || r.profiles?.username || "Mancha member"}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 font-bold text-primary">
                    {r.is_pre_release ? "🔥" : "★"} {r.rating}/10
                  </span>
                  {formatDate(r.created_at)}
                </span>
              </div>
              {r.title && <p className="text-sm font-medium text-text">{r.title}</p>}
              {r.body && <SpoilerText text={r.body} containsSpoilers={r.contains_spoilers} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
