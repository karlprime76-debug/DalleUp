import type { NextConfig } from "next";

function getSupabaseHostname() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) return new URL(url).hostname;
  } catch {
    // ignore
  }
  return null;
}

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : [])
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          }
        ]
      }
    ];
  }
};

export default nextConfig;
