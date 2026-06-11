import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds from replacing chunks used by a running dev server.
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
};

export default nextConfig;
