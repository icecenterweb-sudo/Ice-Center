# Ice-Center — 3-Pass Review Fix Batch: Final Report

> **Date:** 2026-08-30 · **Base commit:** `40d4eac` (HEAD, branch `main`) · **Scope:** 8 groups of confirmed issues from a 3-pass technical review · **Result:** all groups implemented, full verification green.

---

## 1. Verification (live runs)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ **0 errors** |
| Lint | `npx eslint src tests` | ✅ **0 errors / 0 warnings** |
| Tests | `npm test` | ✅ **TOTAL: 80 passed, 0 failed** |

## 2. Git log (HEAD → base, unchanged)

```
40d4eac delete: remove UI_UX_PHASE2_REPORT.md and UI_UX_STANDARDIZATION_ALL_PHASES.md as part of project cleanup
4ef90ae feat: add bulk status update, filtering, and search functionality to orders management dashboard
37fcd5f feat(admin): collapsible sidebar topic dropdowns — accordion-style dropdowns with Framer Motion animations…
b8f66de fix(admin): resolve horizontal overflow in dashboard layout…
b058556 fix(admin): technical polish — invalid Tailwind border-*-150, dead jsonld.ts, unused vars…
566d8d4 feat(admin): unified comments hub — consolidated product reviews and blog comments…
```

No commits were created. All 55 changes are in the working tree, unstaged, ready for review.

## 3. Working tree summary (`git status --short` → 55 changes)

- **Modified (43):** `next.config.ts`, `prisma/schema.prisma`, `src/proxy.ts`, `src/lib/{analytics,rate-limiter,sms}.ts`, `src/hooks/useAuth.tsx`, `src/components/admin/ImageUpload.tsx`, and **36 API route files**.
- **Deleted (4):** `src/lib/user-jwt.ts`, `prisma/backup-db.js`, `prisma/restore-simple.js`, `testpayamak.ts` (see rename below).
- **New (5):** `prisma/migrations/20260830000000_add_product_review_unique/migration.sql`, `scripts/test-sms.ts` (renamed from `testpayamak.ts`), `src/lib/user-auth.ts`, `src/lib/constants.ts`, `TECHNICAL_REVIEW.md` (prior audit).

---

## 4. Group-by-group report

### Group 1 — Data integrity

**1a. Product reviews duplicate-submission race**
- Added `@@unique([productId, userId])` to the `ProductReview` model (`prisma/schema.prisma`).
- **Deviation (flagged):** `prisma migrate dev` fails on this repo because the migration history lacks a baseline (the first migration `20260824203000_migrate_money_to_decimal` cannot replay onto the shadow DB — `Coupon` table missing; a pre-existing condition). Following the repo's own convention (existing migrations are hand-written SQL), I created `prisma/migrations/20260830000000_add_product_review_unique/migration.sql` and applied it with `prisma migrate deploy`.
- Verified **0 duplicate rows** in the local DB before creating the constraint.
- POST handler now maps the resulting `P2002` error to a clean `409` (`src/app/api/products/[id]/reviews/route.ts`), preserving the exact Persian message the app route already expected.

### Group 2 — Error message leaks

**2a. `products/[id]/route.ts` PUT + DELETE**
- Replaced `getErrorMessage(error, fallback)` (which leaked internal details) with static Persian fallback messages on **500**.
- Kept `P2025 → 404` as-is, and matched the POST handler's pattern. Removed the now-unused `getErrorMessage` helper.

### Group 3 — Cart safety & consistency

**3a. Cart sync — cap + batched queries**
- Added `MAX_SYNC_ITEMS = 50` hard cap → `400` on larger payloads.
- Replaced the per-item sequential `findFirst`/`findUnique` with a **single batched** `prisma.product.findMany({ where: { id: { in: syncProductIds }, isActive: true } })` + `Map` lookup, plus one batched `cartItem.findMany` for existing quantities.
- Merge/stock-clamp behavior preserved exactly.

**3b. Cart update validation**
- Moved `MAX_QUANTITY_PER_ITEM` to a new shared module `src/lib/constants.ts`; imported by both cart *add* and cart *update* routes (can't drift).
- `update` now rejects non-integers and values > 100 with the same Persian message as `add`.

### Group 4 — Auth & security

**4a. Admin login OTP race**
- `src/app/api/admin/auth/login/route.ts`: the OTP lookup → attempt-cap check → code comparison → verified-update are now a single `prisma.$transaction(..., { isolationLevel: 'ReadCommitted' })`, mirroring `src/lib/otp.ts`.
- Attempt cap (3) and all user-facing messages unchanged.

**4b. Inconsistent client-IP extraction**
- `src/lib/analytics.ts`: deleted the local spoofable `getClientIp` and imported the trusted-proxy-hop version from `src/lib/rate-limiter.ts`. Only the hashed/stored IP value changes (for spoofed headers); no behavioral shift otherwise.

**4c. CSRF origin check wired into proxy**
- `src/proxy.ts` imports and now calls `validateOrigin()` from `src/lib/security.ts` for `POST/PUT/PATCH/DELETE` — the dead helper is now live.
- Applied at minimum to the admin groups it protects; the check also runs on `/profile/**` and `/checkout/**` mutating requests (same proxy scope). **Deviations (flagged):** applied to the whole protected set for consistency — verify no legitimate cross-origin POST to those routes before deploy.

**4d. Malformed JSON → 400, not 500**
- **19 routes** with zod-validated bodies: `request.json().catch(() => null)` and rely on existing `safeParse` → 400 (same HTTP outcome, less code than a `SyntaxError` branch).
- **Destructured-body routes** fixed with typed `.catch(() => ({}))` casts: `admin/auth/login`, `auth/send-otp`, `auth/verify-otp`, `auth/update-profile`, `cart/add`, `cart/update`, `cart/sync`.
- **Explicit null guards** where null would crash: `orders` (400 if not object), `admin/settings` (400 + `await recordAudit` ← also 7d), `admin/support/rooms/[id]/status` (`body?.status`).
### Group 5 — Unbounded queries (pagination caps)

- **5a.** `GET /api/blog/comments`: added `isNaN(postIdNum)` guard → `400` on invalid input, plus `take: 100`.
- **5b.** `GET /api/products/[id]/reviews`: `take: 50`.
- **5c.** `GET /api/wishlist`: `take: 100`.

### Group 6 — Rate limiting gaps

- **6a.** `/api/analytics/event` and `/api/analytics/visit`: `RATE_LIMITS.relaxed` keyed by `getClientIp` (these were fully unauthenticated with zero rate limiting).
- **6b.** Per-user (keyed by `userId`):
  - `POST /api/wishlist` → `.normal`
  - `POST /api/products/[id]/reviews` → `.strict` (matches blog-comment submissions; reviews go to a moderation queue)
  - `POST /api/notifications` (mark-all-read) → `.normal`
  - `POST /api/auth/update-profile` → `.normal`

### Group 7 — Small correctness/robustness

- **7a.** `src/lib/rate-limiter.ts`: `INCR` + `EXPIRE` are now a **single atomic Lua script** (`redis.eval`) that increments, conditionally expires (first request), and returns the TTL; defensive repair if an orphaned key (`ttl === -1`) is ever encountered. The memory fallback is untouched.
  - **Note:** Upstash's `eval` return typing is loose, so the result is handled with an explicit cast + `Number()` coercion (documented in code). Lua `{count, ttl}` decoding is per Upstash docs.
- **7b.** `src/app/api/orders/route.ts`:
  - Order numbers are now timestamp-prefixed: `ICE-YYMMDD-XXXXXX` (easier support lookups, 2²⁴ entropy per day).
  - The transaction is wrapped in a retry loop (max 3) that only retries on `P2002` whose `meta.target` includes `orderNumber` (other `P2002`s — e.g. coupon usage — still fail through).
- **7c.** `src/lib/sms.ts`: `Content-Length: data.length` → `Buffer.byteLength(data)` (UTF-16 code-unit bug).
- **7d.** `src/app/api/admin/settings/route.ts`: `recordAudit(...)` → `await recordAudit(...)` (no more unhandled-rejection risk).
- **7e.** `src/hooks/useAuth.tsx`: `AuthContext.Provider` value wrapped in `useMemo` with the correct dependency array (matches `CartContext`).
- **7f.** `src/components/admin/ImageUpload.tsx`: `accept="image/*"` → `accept="image/jpeg,image/png,image/webp,image/gif"` (matches the server's MIME allow-list exactly).
- **7g.** `next.config.ts`: added a clear comment above the `images:` block explaining that `unoptimized: true` is a **deliberate** site-owner decision (offline WebP pipeline via `npm run convert:webp` → `scripts/convert-to-webp.ts` + sharp, plus CDN delivery). Other image options are inert while it's set — future maintainers are warned not to "fix" it.
- **7h.** `next.config.ts` security headers: added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` alongside the existing security headers.

### Group 8 — Cleanup

- **8a.** `src/lib/user-jwt.ts` deleted — grep re-verified **zero importers** before deletion.
- **8b.** New `src/lib/user-auth.ts` exports `requireUser(): Promise<{ ok: true, payload } | { ok: false, response }>` (user-side counterpart to `requireAdmin`). Migrated call sites **without changing any authorization logic**:
  - `orders/route.ts` (GET + POST), `orders/[id]/route.ts`, `wishlist/route.ts` (GET/POST/DELETE), `notifications/route.ts` (GET/POST), `notifications/[id]/route.ts` (PATCH/DELETE), `coupons/validate/route.ts`, `products/[id]/reviews/route.ts` (POST).
- **8c.** Legacy duplicate scripts:
  - **Deleted** `prisma/backup-db.js` + `prisma/restore-simple.js` — verified superseded by `scripts/backup-db.ts` / `scripts/import-backup-fast.js` (the `.ts` versions are strictly more complete: they skip ephemeral tables, handle pg_dump SQL, reset sequences).
  - **Kept** `prisma/add-products.js` and `prisma/add-shams-products.js` — one-off seeders with **no `.ts` equivalent** in `scripts/`.
- **8d.** `testpayamak.ts` → **moved** to `scripts/test-sms.ts`.
  - **Deviation (flagged):** while moving it, I also **replaced the hardcoded Melipayamak API key** with `process.env.MELIPAYAMAK_API_KEY` + a guard, and fixed its `Content-Length` (same UTF-16 bug as 7c). The key must still be **rotated** because it lives in git history.
- **8e.** `public/33311176.txt` — **0-byte file** committed as `50a1849 "public: add domain verification file"`. It's a domain-verification file (common for payment/CDN providers); left in place and flagged instead of deleting — needs a human decision.
---

## 5. Files changed (55)

**Modified (43)**
- `next.config.ts`, `prisma/schema.prisma`, `src/proxy.ts`
- `src/lib/analytics.ts`, `src/lib/rate-limiter.ts`, `src/lib/sms.ts`
- `src/hooks/useAuth.tsx`, `src/components/admin/ImageUpload.tsx`
- API routes (36):
  `src/app/api/admin/auth/login/route.ts` · `admin/banners/route.ts` · `admin/banners/[id]/route.ts` · `admin/blog/comments/[id]/route.ts` · `admin/coupons/route.ts` · `admin/coupons/[id]/route.ts` · `admin/reviews/[id]/route.ts` · `admin/settings/route.ts` · `admin/support/rooms/[id]/reply/route.ts` · `admin/support/rooms/[id]/status/route.ts`
  `analytics/event/route.ts` · `analytics/visit/route.ts`
  `auth/send-otp/route.ts` · `auth/update-profile/route.ts` · `auth/verify-otp/route.ts`
  `blog/[slug]/route.ts` · `blog/categories/route.ts` · `blog/comments/route.ts` · `blog/route.ts` · `blog/tags/route.ts`
  `cart/add/route.ts` · `cart/sync/route.ts` · `cart/update/route.ts`
  `coupons/validate/route.ts` · `notifications/route.ts` · `notifications/[id]/route.ts`
  `offers/route.ts` · `offers/[id]/route.ts` · `orders/route.ts` · `orders/[id]/route.ts`
  `products/route.ts` · `products/[id]/route.ts` · `products/[id]/reviews/route.ts`
  `slides/route.ts` · `slides/[id]/route.ts` · `support/chat/send/route.ts` · `user/addresses/route.ts` · `wishlist/route.ts`

**Deleted (4):** `src/lib/user-jwt.ts`, `prisma/backup-db.js`, `prisma/restore-simple.js`, `testpayamak.ts`

**New (5):** `prisma/migrations/20260830000000_add_product_review_unique/migration.sql`, `src/lib/user-auth.ts`, `src/lib/constants.ts`, `scripts/test-sms.ts`, `FIX_BATCH_REPORT.md`

---

## 6. ⚠️ Action items needing a human decision

1. **🚨 Rotate the Melipayamak SMS API key.** The key `c9e9786d…` was committed in git history inside `testpayamak.ts`. It is now sanitized in the working tree, but the history still contains it — rotate it in the Melipayamak dashboard.
2. **Apply the migration to staging/production** with `npx prisma migrate deploy` (not `migrate dev` — this repo's shadow DB cannot replay the un-baselined history). Confirm the target DB has **no duplicate `(productId, userId)` review rows** first, or the unique index creation will fail.
3. **`public/33311176.txt`** — 0-byte domain-verification file; confirm with your hosting/CDN provider whether it's still required.
4. **Proxy CSRF check scope** — origin-vs-host now applies to all mutating requests under the protected route groups including `/profile/**` and `/checkout/**`. Confirm no legitimate cross-origin POST calls to those routes (e.g. test scripts, external tools).

**Nothing has been committed** — all 55 changes remain in the working tree for your review, per the batch instructions.