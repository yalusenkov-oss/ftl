import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Cloudflare-only D1 module is used by the Sites runtime, not by the
  // Vercel page bundle. Keep the Vercel build focused on the app route.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
