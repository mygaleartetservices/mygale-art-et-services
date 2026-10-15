/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

// Baseline security headers (report finding F.1 #4). CSP is intentionally
// scoped to what this app actually needs (self-hosted assets, the media
// CDN, and the WebSocket API) rather than a maximally strict policy that
// would require a broader nonce/hash rollout across the admin editor.
//
// 'unsafe-eval' is added to script-src only in development: Next's webpack
// dev bundler wraps modules in eval() for fast rebuilds/HMR, so without it
// the CSP silently blocks all client-side JS from running under `next dev`
// (hydration, effects, everything) while leaving the server-rendered HTML
// looking fine — production builds don't use eval and stay strict.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://www.google.com",
  "object-src 'none'",
  "img-src 'self' data: blob: https://media.mygaleartetservices.org https://www.media.mygaleartetservices.org",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
  "connect-src 'self' https: wss:",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
]

module.exports = {
  allowedDevOrigins: ['192.168.85.1', 'mygale-art-et-services.vercel.app/'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },

  reactStrictMode: true,

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.mygaleartetservices.org',
      },
      {
        protocol: 'https',
        hostname: 'www.media.mygaleartetservices.org',
      },
    ],
  },

  compress: true,
  poweredByHeader: false,

  // REMOVE distDir completely — Vercel & next-sitemap depend on .next being inside the app
  // distDir: path.join(MONOREPO_ROOT, '.next'),

  // Keep tracing root for monorepo (harmless)
  outputFileTracingRoot: path.resolve(__dirname, '..', '..'),

  turbopack: {},

  experimental: {
    // Remove framer-motion optimization that was causing issues
  },

  // Moved from experimental in Next.js 16
  serverExternalPackages: [],

  webpack(config) {
    config.resolve.cacheWithContext = false

    // Ensure consistent module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    }

    return config
  },
}
