# Performance Analysis & Optimization Report

## Executive Summary
**Current Score:** ~0/100 (LCP: ~30s)
**Primary Bottleneck:** **Blocked Rendering**. The entire homepage waits for *all* database queries to finish before showing *anything*. This is caused by a `Promise.all` fetching strategy wrapped in a single, top-level `Suspense` boundary in `src/app/(shop)/page.tsx`.
**Top Solution:** **Granular Suspense (Streaming)**. Break the homepage into smaller, independent server components that fetch their own data. Wrap each in `Suspense`. This will allow the UI to stream in, showing the Header and maybe the Hero immediately while other heavy data (like products) loads.

---

## 1. Top Performance Bottlenecks (Lighthouse Analysis)
*   **LCP (Largest Contentful Paint) - 30.6s**: CRITICAL. The user sees a white screen for 30 seconds.
*   **FCP (First Contentful Paint) - 28.5s**: The browser receives no meaningful HTML content to paint until the server finishes all work.
*   **TBT (Total Blocking Time)**: High, likely due to hydration of heavy components after the long wait.
*   **Total Byte Weight**: High due to duplicate carousel libraries (`Swiper` + `Embla`) and potentially large image payloads if not optimized.

---

## 2. Concrete Causes in Code

### A. Blocking Data Fetching (The 30s Delay)
**File:** [`src/app/(shop)/page.tsx`](file:///src/app/(shop)/page.tsx)
**Issue:** The `HomeContent` component waits for **7 parallel database queries** to complete before returning any JSX.
```typescript
// All these must finish before the user sees a single pixel
const [categories, categoriesWithProducts, ...] = await Promise.all([
  getCategories(),
  getCategoriesWithProducts(), // Likely very slow (complex nested query)
  ...
]);
```
**Effect:** If `getCategoriesWithProducts` takes 10 seconds, the Hero Slider (which might be ready in 100ms) gets blocked for 10 seconds. The `Suspense` wrapper in `Home` then holds the entire page back.

### B. Duplicate Carousel Libraries (Bundle Size)
**Files:**
*   [`src/components/home/HeroSlider.tsx`](file:///src/components/home/HeroSlider.tsx): Uses `swiper` (Heavy).
*   [`src/components/home/ProductCarousel.tsx`](file:///src/components/home/ProductCarousel.tsx): Uses `embla-carousel-react` (Lightweight).
**Issue:** You are loading two entirely different carousel libraries. `Swiper` is notably heavy and affects TBT/JS execution time.

### C. LCP Image Optimization
**File:** [`src/components/home/HeroSlider.tsx`](file:///src/components/home/HeroSlider.tsx)
**Status:** **Good**. You are correctly using `priority={index === 0}`.
```typescript
<Image ... priority={index === 0} />
```
**Note:** The LCP issue is *not* the image loading speed, but the *server response time* for the HTML that contains the image tag.

---

## 3. Actionable, Prioritized Fixes

### 🚀 Phase 1: Quick Wins (Most Impact on LCP)

#### 1. Implement Granular Suspense (Streaming)
**Impact:** **High** (Will fix the 30s white screen)
**Action:** Refactor `src/app/(shop)/page.tsx`. Instead of fetching everything at the top, create separate server components for each section.

**Current:**
```tsx
// page.tsx
await Promise.all([fetchA, fetchB, fetchC]);
return <><A/><B/><C/></>
```

**Proposed Refactor:**
```tsx
// page.tsx
export default function Home() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection /> {/* Fetches its own slides */}
      </Suspense>

      <Suspense fallback={<CategorySkeleton />}>
        <CategorySection /> {/* Fetches its own categories */}
      </Suspense>

      <Suspense fallback={<ProductRowSkeleton />}>
        <AmazingOfferSection /> {/* Fetches its own offers */}
      </Suspense>
      {/* ... */}
    </>
  )
}
```
**Result:** The Hero section (LCP) will load immediately, independent of the heavy product queries.

#### 2. Optimize `getCategoriesWithProducts`
**Impact:** **Medium** (Reduces server load)
**Action:** The query at line 64 in `page.tsx` is very heavy (nested includes, filters). Ensure database indexes exist for `isActive`, `offer`, and `categoryId`.

### 🛠 Phase 2: Deeper Refactors (JS Size & TBT)

#### 3. Standardize Carousel Library
**Impact:** **Medium** (Reduces Bundle Size)
**Action:** Remove `Swiper` completely. Rewrite `HeroSlider.tsx` to use `embla-carousel-react` (which you already use for products). This will significantly reduce the JavaScript bundle size sent to the client.

#### 4. Font Optimization
**File:** `src/app/layout.tsx`
**Status:** **Good**. You are using `next/font/local` with `woff2`. ensure the font files in `public/fonts` are actually variable fonts or subsetted to keep size down.

---

## Summary of File Paths to Modify
1.  **`src/app/(shop)/page.tsx`**: Refactor heavily to componentize data fetching and add `Suspense` boundaries.
2.  **`src/components/home/HeroSlider.tsx`**: Replace `Swiper` with `Embla Carousel` to match `ProductCarousel`.
3.  **`package.json`**: Uninstall `swiper` after refactoring.

## Recommendation for LCP & TBT
The **single most effective change** for LCP is **#1 (Granular Suspense)**. It will decouple your LCP element (Hero) from the slow product database queries.
