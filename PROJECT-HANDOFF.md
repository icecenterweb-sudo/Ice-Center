# Ice-Center Project Handoff Document
> Created: 2026-01-07 | For next conversation/model

## Project Overview
E-commerce platform built with Next.js 16.1.1 (Turbopack, cacheComponents enabled)

**Tech Stack:**
- Next.js 16.1.1 with `cacheComponents: true`
- PostgreSQL via Prisma with pg adapter
- Redis for caching/sessions
- Cloudinary for image storage
- Vercel deployment + ArvanCloud CDN

---

## Recent Work Completed (This Session)

### 1. ✅ Homepage Full Caching (5 min TTL)
**Files created/modified:**
- `src/lib/cache/homepage.ts` - NEW - Isolated cached queries
- `src/app/(shop)/page.tsx` - Refactored to use only cached imports

**Architecture:**
- All homepage data wrapped in `unstable_cache({ revalidate: 300 })`
- No `connection()`, `cookies()`, or `new Date()` in UI layer
- Time logic only inside cached query functions
- Cache tags: `homepage`, `slides`, `categories`, `offers`, `products`, `banners`, `blog`

**Build status:**
```
○ /    5m    1y   (Static with 5-minute revalidation)
```

### 2. ✅ Base64 Image Migration to Cloudinary
- Migration script: `scripts/migrate-images-to-cloudinary.ts`
- All product/category images now stored as Cloudinary URLs
- `ImageUpload` and `MultiImageUpload` components upload directly to Cloudinary

### 3. ✅ Bundle Optimization
- Removed Swiper library, replaced with Embla Carousel in `HeroSlider.tsx`
- Reduced font weights from 5 to 3 (Regular, SemiBold, Bold)
- Added `sizes` prop to all `next/image` components

### 4. ✅ API Route Prerender Fix
- `src/app/api/auth/me/route.ts` - Added `connection()` + graceful error handling
- Build now runs clean with no warnings

---

## Important Architectural Decisions

### Next.js 16 with cacheComponents
- `revalidate` export is NOT compatible - use `unstable_cache` instead
- `dynamic` export is NOT compatible - use `connection()` to signal dynamic
- Pages are dynamic by default, must opt-in to caching with `"use cache"` or `unstable_cache`

### Cache Invalidation
```typescript
import { revalidateTag } from 'next/cache';
revalidateTag('homepage');  // Invalidate all homepage cache
revalidateTag('slides');    // Or specific sections
```

### Dynamic vs Cached Queries
```
src/lib/cache/homepage.ts  → CACHED (for homepage only)
src/lib/offers/queries.ts  → DYNAMIC (for Cart/Checkout - real-time pricing)
src/lib/blog/queries.ts    → DYNAMIC (for blog pages - has connection())
```

---

## Known Issues / Potential Improvements

1. **Other API routes** may benefit from same `connection()` + error handling pattern
2. **Category/Product pages** could potentially use similar caching strategy
3. **Blog pages** still have `connection()` in queries - could be cached if 5-min delay acceptable
4. **Timer consolidation** - Multiple carousels run 1-second timers; could use shared timer hook

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Homepage cached queries | `src/lib/cache/homepage.ts` |
| Homepage page | `src/app/(shop)/page.tsx` |
| Next.js config | `next.config.ts` |
| API auth route | `src/app/api/auth/me/route.ts` |
| Image upload component | `src/components/admin/ImageUpload.tsx` |
| Hero slider (Embla) | `src/components/home/HeroSlider.tsx` |

---

## User Preferences (from memory)
- Do NOT commit changes or build until explicitly told
- Do NOT add anything to memory unless explicitly told
- ChatWindow should be full-screen on mobile with input floating above bottom nav
- 'Back' button in header instead of status text

---

## Build Command
```bash
npm run build
```
Current status: ✅ Clean build, no errors, no warnings

---

Good luck! 🚀
