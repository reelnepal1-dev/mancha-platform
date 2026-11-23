"use client";

import { useState } from "react";

/**
 * Brief rule: a review with contains_spoilers = true MUST stay blurred
 * behind a "Tap to Reveal Spoiler" toggle until the reader taps it.
 */
export function SpoilerText({ text, containsSpoilers }: { text: string; containsSpoilers: boolean }) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (revealed) {
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-line text-sm leading-6 text-text">{text}</p>
        {containsSpoilers && (
          <button onClick={() => setRevealed(false)} className="text-xs text-muted hover:text-text">
            Hide spoiler
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      aria-label="Tap to Reveal Spoiler"
      className="relative block w-full overflow-hidden rounded-lg text-left"
    >
      <p aria-hidden className="select-none whitespace-pre-line text-sm leading-6 text-text blur-md">
        {text}
      </p>
      <span className="absolute inset-0 flex items-center justify-center bg-bg/40">
        <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-text shadow">
          ⚠ Tap to Reveal Spoiler
        </span>
      </span>
    </button>
  );
}
