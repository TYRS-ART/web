import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Spotify playlist and album artwork (oEmbed thumbnails).
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
