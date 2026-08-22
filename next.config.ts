import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. Locks the site down to only the origins it actually
 * needs: itself, Firebase (auth + Firestore + Storage), and YouTube for
 * property videos. Images are allowed from any HTTPS host because admins paste
 * arbitrary photo URLs. 'unsafe-eval' is only permitted in dev (Turbopack).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.googleapis.com wss://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://www.google.com https://maps.google.com",
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    /*
     * Doing what the note that used to sit here said to do.
     *
     * It read: "Listings use local SVG placeholders / pasted URLs, so the
     * optimizer is off. When real raster photos are hosted, set unoptimized:
     * false." Real raster photos are hosted — offices upload them and they are
     * served from the bucket through /api/img — so the condition is met.
     *
     * What it was costing: a card cover went out at full size to everybody,
     * about 92KB each, where the hotels site sends the same photograph at
     * 19KB to a phone. Twenty cards is 1.8MB instead of 400KB, on a listings
     * page most people open on mobile data.
     *
     * The SVGs the note worried about are still there, and the optimizer still
     * refuses them. `isRawSrc` marks those — and data:/blob: previews —
     * unoptimized at the call site, so they pass through untouched.
     */
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The real dashboard lives at a secret path (/hq). Send the obvious /admin
  // guess back to the home page so it isn't a discoverable entry point.
  async redirects() {
    return [
      // The site answers on two names. Without this both would serve the same
      // pages at 200 and compete as duplicates of each other, so the old name
      // hands every path — not just the homepage — to the new one.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?homeskurdistan\\.com" }],
        destination: "https://homes.layhama.com/:path*",
        permanent: true,
      },
      { source: "/admin", destination: "/", permanent: false },
      { source: "/admin/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
