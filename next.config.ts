import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Admin SDK + transcript fetcher out of the bundle so they resolve
  // natively in the Netlify serverless runtime.
  serverExternalPackages: ["firebase-admin", "youtube-transcript"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
