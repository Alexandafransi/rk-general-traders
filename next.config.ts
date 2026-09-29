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
      {
        // Django admin URLs need the trailing slash back too (same reason as
        // /api/ above) — this makes /admin/ reachable through the same single
        // origin as the rest of the app, instead of requiring direct access
        // to the backend's own port.
        source: "/admin/:path*",
        destination: `${BACKEND_INTERNAL_URL}/admin/:path*/`,
      },
      {
        // Static assets are actual filenames — never add a trailing slash here,
        // it would corrupt the requested file (e.g. "style.css/").
        source: "/static/:path*",
        destination: `${BACKEND_INTERNAL_URL}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;
