import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix Turbopack workspace-root mis-detection when the repo root
    // sits above the Next.js project directory.
    root: path.resolve(__dirname),
  },

  // ── Security headers ────────────────────────────────────────────────────
  // COOP must be same-origin-allow-popups (not the stricter same-origin)
  // so that Firebase signInWithPopup can call window.closed on its own
  // popup and detect when the user closes or completes the Google flow.
  // Without this Next.js would emit same-origin, causing the repeated
  // "Cross-Origin-Opener-Policy policy would block the window.closed call"
  // warnings and breaking the sign-in popup in some browsers.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
