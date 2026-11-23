import type { NextConfig } from "next";

// Cloudflare Pages: fully static export to `out/`.
// Data is read from Supabase at build time; rebuild (e.g. after each sync) to refresh.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
