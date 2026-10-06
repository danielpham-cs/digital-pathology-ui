import type { NextConfig } from "next";

// The browser always talks to the frontend origin; Next proxies /api to the
// tile server (same-origin → no CORS, works on localhost and on a LAN IP alike).
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone", // small self-contained server for the Docker image
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
