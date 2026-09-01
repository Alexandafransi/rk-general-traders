import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        // Next.js's `:path*` capture drops trailing slashes when building the
        // destination, but every Django URL here requires exactly one — force
        // it back on, since every backend route below needs it.
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
