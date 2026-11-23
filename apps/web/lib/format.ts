export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mancha.pages.dev";

const LANG_NAMES: Record<string, string> = {
  ne: "Nepali",
  hi: "Hindi",
  en: "English",
  new: "Newari",
  mai: "Maithili",
  bho: "Bhojpuri",
};

export const languageName = (code: string | null | undefined) =>
  code ? (LANG_NAMES[code] ?? code.toUpperCase()) : "";

export const npr = (n: number | null | undefined) =>
  n == null ? "" : `NPR ${new Intl.NumberFormat("en-IN").format(n)}`;

/** Compact NPR for box office: NPR 2.4 Cr / NPR 35 L */
export const nprCompact = (n: number | null | undefined) => {
  if (n == null) return "";
  if (n >= 1e7) return `NPR ${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 1e5) return `NPR ${(n / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
  return npr(n);
};

export const formatDate = (iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kathmandu",
        ...opts,
      }).format(new Date(iso))
    : "";

export const formatDateTime = (iso: string) =>
  formatDate(iso, { weekday: "short", hour: "numeric", minute: "2-digit" });

export const truncate = (s: string | null | undefined, n = 155) =>
  !s ? "" : s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;

export const STATUS_LABEL: Record<string, string> = {
  now_showing: "Now Showing",
  pre_booking: "Pre-Booking",
  upcoming: "Upcoming",
  running: "Running Now",
};
