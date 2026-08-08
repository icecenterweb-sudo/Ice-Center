import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // React Compiler - Auto-memoizes components, reduces re-renders
  reactCompiler: true,

  // Cache Components - includes PPR in Next.js 16
  // Testing with Next.js 16.1.1 (updated from 16.0.10)
  cacheComponents: true,

  // Experimental optimizations
  experimental: {
    // Better tree-shaking for icon libraries and heavy packages
    // NOTE: Don't add 'swiper' here - it has a custom module system that breaks HMR
    optimizePackageImports: [
      'lucide-react',
      '@solar-icons/react',
      // 'date-fns',        // Uncomment if you use date-fns
      // 'lodash',          // Uncomment if you use lodash
    ],
    // Faster dev builds with file system caching, no need this for vps server.
    // turbopackFileSystemCacheForDev: true,
  },

  // Logging - reduces noise in production
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Compression - enable gzip
  compress: true,

  // Powered by header - remove for security
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,

  output: 'standalone', // Self-contained Docker/VPS deployment

  // Bundle analyzer (uncomment to analyze)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },

  images: {
    // Disable Next.js built-in image optimization
    unoptimized: true,
    // Modern formats for smaller file sizes
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize image processing time
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },

  // Cache headers for better performance with Vercel + ArvanCloud CDN
  async headers() {
    return [
      // ==========================================
      // SECURITY HEADERS (Global)
      // ==========================================
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.melipayamak.com https://*.upstash.io https://*.google-analytics.com https://*.googletagmanager.com https://*.vercel.com https://analytics.vercel.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.neon.tech https://res.cloudinary.com ws: wss:;",
              "media-src 'self'",
            ].join('; '),
          },
        ],
      },

      // ==========================================
      // HTML PAGES - CDN Caching
      // ==========================================

      // Homepage - 2 min fresh, 1 week stale-while-revalidate
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=120, stale-while-revalidate=604800',
          },
        ],
      },
      // Category index page - 2 min fresh, 2 weeks stale
      {
        source: '/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=120, stale-while-revalidate=1209600',
          },
        ],
      },
      // Category detail pages - 2 min fresh, 2 weeks stale
      {
        source: '/categories/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=120, stale-while-revalidate=1209600',
          },
        ],
      },
      // Product pages - 2 min fresh, 2 weeks stale
      {
        source: '/products/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=120, stale-while-revalidate=1209600',
          },
        ],
      },
      // Blog pages - 5 min fresh, 2 weeks stale
      {
        source: '/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=1209600',
          },
        ],
      },

      // ==========================================
      // STATIC ASSETS - Long-term cache
      // ==========================================

      // Static assets (JS, CSS) - Long-term cache with immutable
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fonts - Long-term cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public images - Cache for 1 week
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // Uploaded files in public/uploads/ - Cache for 1 week
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },

      // ==========================================
      // API ROUTES
      // ==========================================

      // API routes - Default no-cache for safety
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // Public read-only APIs can be cached
      {
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
