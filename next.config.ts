import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // React Compiler - Auto-memoizes components, reduces re-renders
  reactCompiler: true,

  // Experimental optimizations
  experimental: {
    // Better tree-shaking for icon libraries
    optimizePackageImports: ['lucide-react', '@solar-icons/react'],
    // Faster dev builds with file system caching
    turbopackFileSystemCacheForDev: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
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

