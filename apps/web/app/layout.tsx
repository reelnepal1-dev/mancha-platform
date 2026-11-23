import type { Metadata, Viewport } from "next";

import { Header } from "@/components/Header";
import { SITE_URL } from "@/lib/format";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mancha (मञ्च) — Movies, Theatre & Events in Nepal",
    template: "%s | Mancha",
  },
  description:
    "Discover what's showing in Nepal: movies now in cinemas, live theatre plays, concerts and festivals — with spoiler-free synopses, community ratings, and ticket links.",
  keywords: ["Nepal movies", "Nepali films", "Kathmandu theatre", "Nepal events", "concerts Kathmandu", "box office Nepal"],
  openGraph: { type: "website", siteName: "Mancha", locale: "en_NP" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#0D1117", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg font-sans text-text">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          Mancha (मञ्च) · Nepal&apos;s entertainment hub · Movie data from TMDB &amp; OMDb
        </footer>
      </body>
    </html>
  );
}
