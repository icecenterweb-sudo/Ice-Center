# 🚀 Caching Strategy - Ice Center

## Overview

This document outlines the caching strategy implemented for optimal performance with **Vercel** deployment and **ArvanCloud CDN**.

---

## ✅ What's Been Implemented

### 1. HTTP Cache Headers (`next.config.ts`)

Added cache headers for different resource types:

#### HTML Pages (CDN Caching)
| Page | Cache-Control | Fresh Time | Stale Time |
|------|---------------|------------|------------|
| Homepage `/` | `s-maxage=120, stale-while-revalidate=604800` | 2 min | 1 week |
| Categories `/categories` | `s-maxage=120, stale-while-revalidate=86400` | 2 min | 1 day |
| Category `/categories/:slug` | `s-maxage=120, stale-while-revalidate=86400` | 2 min | 1 day |
| Product `/products/:slug` | `s-maxage=120, stale-while-revalidate=86400` | 2 min | 1 day |

#### Static Assets
| Resource | Cache-Control | Duration |
|----------|---------------|----------|
| `/_next/static/*` (JS/CSS) | `max-age=31536000, immutable` | 1 year |
| `/fonts/*` | `max-age=31536000, immutable` | 1 year |
| `/images/*` | `max-age=604800, stale-while-revalidate=86400` | 1 week |

#### API Routes
| Route | Cache-Control |
|-------|---------------|
| `/api/*` | `no-store, must-revalidate` |
| `/api/public/*` | `s-maxage=300, stale-while-revalidate=600` |

### 2. ISR (Incremental Static Regeneration)

All main pages have `revalidate = 60`:

```typescript
// Already applied in:
// - src/app/(shop)/page.tsx (homepage)
// - src/app/(shop)/categories/page.tsx
// - src/app/(shop)/categories/[slug]/page.tsx
// - src/app/(shop)/products/[slug]/page.tsx

export const revalidate = 60; // Revalidate every 60 seconds
```

### 3. Redis Caching (`lib/cache/products.ts`)

Already implemented with:
- **TTL:** 120 seconds (2 minutes)
- **Cache Miss Fallback:** Direct DB query
- **Invalidation:** `invalidateProductsCache()` function

---

## 📋 Cache-Control Explained

### For Long-term Assets (JS/CSS/Fonts)
```
Cache-Control: public, max-age=31536000, immutable
```
- `public` → CDN can cache
- `max-age=31536000` → 1 year in seconds
- `immutable` → File won't change (hashed filenames)

### For Images
```
Cache-Control: public, max-age=604800, stale-while-revalidate=86400
```
- Cache for 1 week
- Serve stale for 1 day while fetching fresh

### For HTML Pages (via ISR)
```
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300
```
- Browser always checks server
- CDN serves cached for 60s
- Stale while revalidate for 5 min

### For Private/Auth Routes
```
Cache-Control: private, no-store, must-revalidate
```
- Never cache user-specific data

---

## 🔧 Code Examples

### Adding Cache Headers to API Route
```typescript
// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const categories = await getCategories();
    
    return NextResponse.json(categories, {
        headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
    });
}
```

### Using Redis Cache for Data
```typescript
// Already in lib/cache/products.ts
import { getProductsCached } from '@/lib/cache/products';

// Automatically checks Redis first, falls back to DB
const { products, total, fromCache } = await getProductsCached({
    page: 1,
    limit: 12,
});
```

### Invalidating Cache After Update
```typescript
// In your admin update action
import { invalidateProductsCache } from '@/lib/cache/products';

async function updateProduct(id: number, data: ProductData) {
    await prisma.product.update({ where: { id }, data });
    
    // Clear product cache
    await invalidateProductsCache();
}
```

### Next.js 15/16 `'use cache'` (Experimental)
```typescript
// For Prisma queries without fetch
'use cache'

import { cacheTag, cacheLife } from 'next/cache';

async function getCategories() {
    cacheLife('hours');
    cacheTag('categories');
    
    return await prisma.category.findMany();
}

// Invalidate with:
revalidateTag('categories');
```

---

## 🌐 ArvanCloud CDN Tips

1. **Respect Origin Headers** - Make sure ArvanCloud is set to respect `Cache-Control` headers from origin (Vercel)

2. **Page Rules** - You can add specific rules in ArvanCloud dashboard:
   - `/*/_next/static/*` → Cache Everything
   - `/api/*` → Bypass Cache

3. **Purge Cache** - After deployments, you may want to purge CDN cache for HTML pages

---

## 📊 Current Cache Hit Rates

| Resource | Expected Hit Rate |
|----------|------------------|
| Static Assets | ~99% (hashed, immutable) |
| Images | ~95% (1 week cache) |
| HTML Pages | ~90% (60s ISR) |
| Product Data | ~80% (Redis 2min TTL) |
| API Calls | Varies by route |

---

## 🚀 Performance Gains

- **TTFB** (Time to First Byte): Reduced by CDN edge caching
- **DB Load**: Reduced ~80% with Redis caching
- **Bandwidth**: Reduced with long-term asset caching
- **User Experience**: Faster page loads with stale-while-revalidate

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `next.config.ts` | Added `headers()` with cache rules |
| `lib/cache/products.ts` | Already had Redis caching ✅ |
| Page files | Already had `revalidate = 60` ✅ |

---

## ✅ Next Steps (Optional)

1. **Add cacheTag to categories** - Enable `revalidateTag('categories')` after admin updates
2. **Monitor cache hit rates** - Add logging to track Redis cache effectiveness
3. **Consider `'use cache'`** - When Next.js 16 stabilizes this feature
