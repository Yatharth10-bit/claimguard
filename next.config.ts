import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standard .next on Vercel; local prod builds use .next-prod to avoid clobbering dev.
  distDir: process.env.VERCEL ? ".next" : process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
};

export default nextConfig;
