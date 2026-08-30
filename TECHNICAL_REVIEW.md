# Ice-Center — Technical Review & Improvement Report

> **Date:** 2026-08-29 · **Branch:** `main` · **Commit:** `40d4eac`
> **Scope:** Full-project audit — security, correctness, performance, architecture.
> **Verdict:** ✅ **Strong, production-hardened codebase.** 7 confirmed bugs/issues found (all low-risk to fix), plus 6 improvement recommendations. No critical vulnerabilities.

---

## 1. Verification Results (all checks run live)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ 0 errors |
| Lint | `npx eslint .` | ✅ 0 errors |
| Tests | `npm test` | ✅ **80 / 80 passed** |
| Secrets in git | `git ls-files` audit | ✅ `.env*`, `products.txt`, `ice-center-vps.zip` all gitignored |

### What was audited
- **Auth & JWT** (`src/lib/jwt.ts`, `admin-auth.ts`, `user-jwt.ts`)
- **OTP flow** (`src/lib/otp.ts`, `send-otp`, `verify-otp`, `admin/auth/login`)
- **Checkout & money** (`api/orders`, `lib/coupons.ts`, `lib/offers/pricing.ts`, `lib/shipping.ts`)
- **Cart** (`api/cart/add|update|sync|remove`)
- **File uploads** (`api/upload`, `lib/uploads.ts`)
- **Cron jobs** (`api/cron/*`, `vercel.json`)
- **Rate limiting & Redis** (`lib/rate-limiter.ts`, `lib/redis.ts`)
- **DB layer** (`lib/db.ts` — pg pool + Prisma adapter)
- **Security headers / CSP** (`next.config.ts`)
- **XSS vectors** (all 4 `dangerouslySetInnerHTML` sites — all JSON-LD, escaped via `serializeJsonLd`)

### Strengths worth protecting (do not regress these)
1. **Unified JWT with `type` claim** — a user token can never be accepted as an admin token and vice-versa.
2. **Checkout integrity** — `FOR UPDATE` row locks on `Product` and `Coupon`, locks acquired in deterministic id-sorted order (deadlock-safe), coupon re-validated *inside* the transaction, prices computed server-side only.
3. **OTP hygiene** — SHA-256 hashed codes, per-phone cooldown, attempt caps, transactional verify (`ReadCommitted`), daily cleanup cron.
4. **Upload hardening** — admin-only, MIME allow-list **plus** magic-byte validation, 5 MB cap, path sanitization, UUID filenames.
5. **Defense-in-depth culture** — audit refs `#9 #21 #23 #31 #34` show regressions are actively guarded. Keep it.
6. **Caching strategy** — Redis (Upstash) with graceful DB fallback everywhere; CDN cache headers with stale-while-revalidate.

---

## 2. 🐛 Confirmed Bugs & Issues (7)

Severity legend: 🔴 should fix soon · 🟡 fix when convenient · 🟢 cosmetic/hygiene

### Bug #1 — 🔴 CSRF helper is dead code: `validateOrigin()` is never called
- **File:** `src/lib/security.ts:7`
- **Problem:** `validateOrigin()` exists specifically to protect state-changing API endpoints from cross-site requests, but it is **imported by zero files**. The CSRF mitigation is currently *not applied anywhere*. (Auth relies on `SameSite=Lax` cookies, which blocks most CSRF, but Lax still allows top-level cross-site POST navigations.)
- **Better strategy:** Either wire it into all state-changing routes (`POST/PUT/DELETE` handlers), or — the recommended, more scalable approach — enforce origin checks globally in a `middleware.ts`:

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin) {
      const host = req.headers.get('host');
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}
```
- Or, if you decide the cookie `SameSite=Lax` is sufficient, **delete** `security.ts` — dead security code creates false confidence.

### Bug #2 — 🔴 `parseInt(postId)` without NaN check → 500 instead of 400
- **File:** `src/app/api/blog/comments/route.ts:32`
- **Problem:** `GET /api/blog/comments?postId=abc` → `parseInt('abc')` = `NaN` → Prisma throws → unhandled **500** + error-log noise. Every other ID-parse site in the codebase does the `isNaN` check; this one was missed.
- **Fix:**

```ts
const postIdNum = parseInt(postId, 10);
if (isNaN(postIdNum) || postIdNum < 1) {
  return NextResponse.json({ error: 'postId نامعتبر است' }, { status: 400 });
}
```
- **Also:** the GET returns *all* approved top-level comments with no pagination — add `take`/`skip` (e.g. cap at 100) before a popular post makes this endpoint heavy.

### Bug #3 — 🟡 Cart update: missing integer & max-quantity validation
- **File:** `src/app/api/cart/update/route.ts:28`
- **Problem:** The add route validates `Number.isInteger(quantity)` and caps at `MAX_QUANTITY_PER_ITEM = 100`. The update route only checks `quantity < 1` — so `1.5` passes (and gets stored), and the 100-cap is not enforced (stock cap is the only limit).
- **Fix:** mirror the add route:

```ts
if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
  return NextResponse.json({ error: 'تعداد نامعتبر است' }, { status: 400 });
}
```
- Tip: move the constant into a shared module (e.g. `src/lib/constants.ts`) so add/update/sync can't drift.

### Bug #4 — 🔴 Cart sync is unbounded: DoS + performance vector
- **File:** `src/app/api/cart/sync/route.ts:34`
- **Problem:** The `items` array has **no length cap** and the loop performs **2+ sequential DB round-trips per item** (`findFirst` + `findUnique` + `upsert`). A logged-in user POSTing 10,000 items generates ~30,000 sequential queries per request. Even though it's authenticated, this is an easy resource-exhaustion vector and would also time out in serverless.
- **Fix (two parts):**

```ts
const MAX_SYNC_ITEMS = 50;
if (items.length > MAX_SYNC_ITEMS) {
  return NextResponse.json({ error: `حداکثر ${MAX_SYNC_ITEMS} قلم قابل همگام‌سازی است` }, { status: 400 });
}
```
  Then replace the per-item `findFirst` calls with **one** batched query:

```ts
const ids = [...new Set(items.map(i => i.productId))];
const products = await prisma.product.findMany({
  where: { id: { in: ids }, isActive: true },
  select: { id: true, stock: true },
});
const productMap = new Map(products.map(p => [p.id, p]));
```

### Bug #5 — 🟡 Order-number collision fails the entire checkout
- **File:** `src/app/api/orders/route.ts:152`
- **Problem:** `ICE-${crypto.randomBytes(5).toString('hex').toUpperCase()}` gives 2⁴⁰ ≈ 1.1T combinations. Collision probability is tiny, but there is **no retry** — if the unique constraint fires mid-transaction, the customer gets a generic 500 and their cart is *not* cleared (transaction rolls back), which is confusing.
- **Fix (recommended): timestamp-prefixed number — more entropy *and* human-debuggable for support:**

```ts
function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ICE-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
```
  And wrap the transaction in a small retry loop (max 3) catching Prisma error code `P2002` on `orderNumber`.

### Bug #6 — 🟡 Rate limiter: `INCR` + `EXPIRE` is not atomic → permanent lockout possible
- **File:** `src/lib/rate-limiter.ts:53-57`
- **Problem:** If the process crashes (or connection drops) *between* `INCR` and `EXPIRE`, the counter key exists **with no TTL**. `redis.ttl()` then returns `-1`, the fallback `resetIn` lies to the user, and the key never expires — that IP/phone is rate-limited **until a manual flush**. On a self-hosted VPS with flaky Upstash connectivity, this is a realistic failure mode.
- **Fix — make it atomic with a Lua script (Upstash supports `eval`):**

```ts
const LUA_INCR_EXPIRE = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {count, ttl}
`;
const [count, ttl] = await redis.eval(LUA_INCR_EXPIRE, [redisKey], [String(expireSeconds)]) as [number, number];
// Defensive: if ttl is -1 (legacy orphan key), repair it
if (ttl === -1) await redis.expire(redisKey, expireSeconds);
```

### Bug #7 — 🟢 Contradictory Next.js image config
- **File:** `next.config.ts` (images block)
- **Problem:** `unoptimized: true` disables Next's image optimizer, yet `formats`, `deviceSizes`, `imageSizes`, `minimumCacheTTL`, and `remotePatterns` are still configured — they are **inert** while unoptimized is set. Misleading for future maintainers.
- **Fix:** delete the inert options and keep a comment explaining the tradeoff (offline WebP pipeline via `npm run convert:webp` + CDN), or re-enable optimization with `remotePatterns` if you ever want runtime optimization.

---

## 3. 🚀 Improvement Recommendations (not bugs — better strategies)

### R1 — Add `src/middleware.ts` (biggest win)
There is **no middleware at all**. Admin route protection relies on every admin page/route remembering to call `requireRolePage()` / `requireRole()`. One forgotten call = an open admin endpoint. A cheap middleware adds defense-in-depth:

```ts
// src/middleware.ts — first gate (cheap JWT check); DB checks stay in requireAdmin()
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) {
      return req.nextUrl.pathname.startsWith('/api')
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', req.url));
    }
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
    } catch {
      return req.nextUrl.pathname.startsWith('/api')
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
```

### R2 — Rate-limit the unauthenticated analytics endpoints
`/api/analytics/event` and `/api/analytics/visit` accept unauthenticated writes with **no rate limit and no origin check** — an easy log-flooding / DB-write-amplification vector. Apply `RATE_LIMITS.relaxed` keyed by `getClientIp`, and consider sampling or batching client events.

### R3 — Harden CSP
`script-src 'self' 'unsafe-inline' 'unsafe-eval'` significantly weakens XSS protection. Pragmatic upgrade path: drop `'unsafe-eval'` first (usually only needed in dev), then migrate to nonce-based `script-src` served via middleware. `'unsafe-inline'` on `style-src` is common and low-risk.

### R4 — Cart-add TOCTOU race (document & accept)
`api/cart/add` checks stock, then increments in a separate `upsert` — two concurrent adds can overshoot stock. This is **acceptable** because checkout re-checks stock under `FOR UPDATE` locks (the authoritative gate). Just document it in the route so nobody "fixes" it by adding locks to a hot path.

### R5 — Delete the deprecated shim
`src/lib/user-jwt.ts` is a backward-compat re-export with **zero remaining importers**. Safe to delete (search confirmed no imports).

### R6 — Housekeeping
- `prisma/add-products.js`, `add-shams-products.js`, `backup-db.js`, `restore-simple.js` are legacy `.js` duplicates of newer `scripts/*.ts` versions — archive or delete to avoid two divergent seed paths.
- `public/33311176.txt` is tracked in git — if it's a CDN/verification file, fine; if not, remove.
- `testpayamak.ts` at repo root looks like a scratch SMS test — move into `scripts/` or delete.

---

## 4. Priority Matrix

| # | Item | Severity | Effort | Risk of fixing |
|---|---|---|---|---|
| 4 | Cart sync cap + batch query | 🔴 High | ~30 min | Very low |
| 1 | CSRF middleware (origin check) | 🔴 High | ~30 min | Low (test top-level POST flows) |
| 2 | `postId` NaN → 400 + pagination | 🔴 Medium | ~10 min | None |
| 6 | Atomic rate-limit Lua | 🟡 Medium | ~20 min | Low (memory fallback unchanged) |
| 5 | Order number retry/prefix | 🟡 Medium | ~20 min | None |
| 3 | Cart update integer check | 🟡 Low | ~5 min | None |
| 7 | Prune inert image config | 🟢 Low | ~5 min | None |
| R1 | Admin middleware | 🔴 High | ~45 min | Medium (watch redirect loops on login page) |
| R2 | Analytics rate limit | 🟡 Medium | ~15 min | None |
| R3 | CSP hardening | 🟡 Medium | ~1–2 h | Medium (test all inline scripts) |
| R5–R6 | Cleanup | 🟢 Low | ~15 min | None |

**Suggested order:** #4 → #2 → #3 → #6 → #5 → R2 (all safe, ~90 min total) → then #1 + R1 together in one PR (both touch middleware) → R3 last.

---

## 5. Final Word

This is a **well-engineered project** — the fundamentals (money as Decimal, transactional checkout with row locks, hashed OTPs, typed JWT separation, graceful cache degradation, 80 regression tests) are exactly right and rare to see done this consistently.

The 7 findings are edge-case polish, not structural flaws. The two most valuable *strategic* upgrades are the **admin middleware (R1)** and **origin-check middleware (#1)** — both close "human error" gaps rather than code bugs.

---

## 6. Second-Pass Review — by Antigravity (Claude Opus 4.6)

> **Date:** 2026-08-29 · **Reviewer:** Antigravity (AI)
> **Scope:** Full codebase re-audit — API routes, lib/, context/, hooks/, components, config files.
> **Method:** Manual line-by-line read of ~60 route files, all lib modules, context providers, hooks, and config.

### Corrections to Original Review

#### C1 — R1 ("No middleware at all") is outdated — `src/proxy.ts` exists
- **File:** `src/proxy.ts`
- **Context:** The original review's recommendation R1 states "There is **no middleware at all**" and proposes adding `src/middleware.ts`. However, the project already has `src/proxy.ts` which is the Next.js 16 equivalent of middleware (renamed per Next.js 16 convention). It protects:
  - `/admin/dashboard/**` — requires valid admin JWT, redirects to login
  - `/api/admin/**` (excluding `/api/admin/auth/**`) — requires valid admin JWT, returns 401
  - `/profile/**` and `/checkout/**` — requires valid user JWT, redirects to `/auth`
- **Impact:** R1 is **already implemented**. The only gap is that `proxy.ts` does not include the CSRF origin check from Bug #1 — that could still be added to the proxy.

#### C2 — Bug #1 (CSRF) is partially mitigated by the proxy
- The proxy in `src/proxy.ts` already provides a defense layer for admin and authenticated routes. The CSRF origin-check recommendation is still valid but less critical than stated, since the `SameSite=Lax` cookies plus proxy JWT verification cover most attack surfaces. The origin check would add defense-in-depth for the remaining edge case (top-level cross-site POST navigations).

---

### 🐛 New Bugs Found (5)

#### Bug #8 — 🔴 Product PUT route leaks internal error messages to client
- **File:** `src/app/api/products/[id]/route.ts:122-125`
- **Problem:** The `PUT` handler's catch block uses `getErrorMessage(error, fallback)` which returns `error.message` for any `Error` instance. When a Prisma error (other than `P2025`) or any unexpected error occurs, the raw internal error message is sent directly to the client in the JSON response:
  ```ts
  return NextResponse.json({
    success: false,
    message: getErrorMessage(error, 'خطا در ویرایش محصول')  // leaks error.message!
  }, { status: 400 });
  ```
  This can expose database schema details, constraint names, or internal stack information to an attacker. The `POST` and `DELETE` handlers on the same file correctly use a static fallback message.
- **Fix:** Replace with the static fallback for non-`P2025` errors:
  ```ts
  return NextResponse.json({
    success: false,
    message: 'خطا در ویرایش محصول'
  }, { status: 500 });  // also change to 500 — unknown errors aren't client faults
  ```

#### Bug #9 — 🟡 Admin login OTP verification is not transactional — race condition
- **File:** `src/app/api/admin/auth/login/route.ts:56-99`
- **Problem:** The admin login route reads the OTP, checks it, increments attempts, and marks it verified using **separate sequential queries** (not inside a `$transaction`). Two concurrent requests with the same correct OTP code can both pass the `validOtp.code !== hashOtp(otp)` check before either marks it as `verified: true`. This means a single OTP can be used twice to generate two valid admin tokens.
  Compare with the user OTP verify flow in `src/lib/otp.ts:87` which correctly uses `prisma.$transaction()` with `ReadCommitted` isolation.
- **Impact:** Low probability but high severity — it affects admin authentication.
- **Fix:** Wrap the OTP lookup, attempt-check, code-comparison, and verified-update in a single `prisma.$transaction()` block, mirroring the user OTP flow:
  ```ts
  const result = await prisma.$transaction(async (tx) => {
    const validOtp = await tx.otpRequest.findFirst({
      where: { phone, verified: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!validOtp) return { valid: false, error: 'expired' };
    if (validOtp.attempts >= MAX_ADMIN_ATTEMPTS) return { valid: false, error: 'maxAttempts' };
    if (validOtp.code !== hashOtp(otp)) {
      await tx.otpRequest.update({ where: { id: validOtp.id }, data: { attempts: validOtp.attempts + 1 } });
      return { valid: false, remaining: MAX_ADMIN_ATTEMPTS - validOtp.attempts - 1 };
    }
    await tx.otpRequest.update({ where: { id: validOtp.id }, data: { verified: true } });
    return { valid: true };
  }, { isolationLevel: 'ReadCommitted' });
  ```

#### Bug #10 — 🟡 `analytics.ts` uses a different `getClientIp` than `rate-limiter.ts` — inconsistent IP extraction
- **Files:** `src/lib/analytics.ts:167-171` vs `src/lib/rate-limiter.ts:145-165`
- **Problem:** There are **two different `getClientIp()` implementations**:
  - `rate-limiter.ts` (lines 145-165): Correctly reads from right-to-left in `x-forwarded-for` using `TRUSTED_PROXY_HOPS`, then falls back to `x-real-ip`.
  - `analytics.ts` (lines 167-171): Naively reads the **leftmost** (client-supplied, spoofable) IP from `x-forwarded-for`, then falls back to `x-real-ip`.
  
  This means analytics IP hashes are based on client-spoofable data, while rate limiting uses the correct proxy-aware extraction. An attacker can poison their analytics IP hash to evade per-IP analytics tracking or to frame another IP.
- **Fix:** Delete the local `getClientIp` in `analytics.ts` and import from `rate-limiter.ts`:
  ```ts
  import { getClientIp } from '@/lib/rate-limiter';
  ```

#### Bug #11 — 🟡 Product reviews GET endpoint has no pagination — unbounded query
- **File:** `src/app/api/products/[id]/reviews/route.ts:28-41`
- **Problem:** The `GET` handler fetches **all** approved reviews for a product with no `take`/`skip` limit. A product with hundreds of reviews will return an unbounded result set. This is the same class of issue as the blog comments (Bug #2) but in a different route.
- **Fix:** Add `take: 50` (or a configurable limit with pagination params):
  ```ts
  const reviews = await prisma.productReview.findMany({
    where: { productId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 50,  // cap results
    // ...select
  });
  ```

#### Bug #12 — 🟢 `Content-Length` header in SMS module uses string byte count, not UTF-8 byte count
- **File:** `src/lib/sms.ts:38`
- **Problem:** The `Content-Length` header is set using `data.length` (JavaScript string length = number of UTF-16 code units), but HTTP `Content-Length` must reflect the **byte length** of the body. For this particular payload (`{ to: "09..." }`) the phone number is always ASCII, so `data.length` happens to equal byte length. However, if the payload ever includes non-ASCII characters (e.g., a future field with Persian text), the `Content-Length` would be wrong, causing truncated requests.
- **Fix:** Use `Buffer.byteLength(data)`:
  ```ts
  'Content-Length': Buffer.byteLength(data),
  ```

---

### 🚀 New Improvement Recommendations (7)

#### R7 — Centralize user authentication extraction into a helper
- **Observation:** At least 10+ API routes repeat the exact same 8-line pattern:
  ```ts
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;
  if (!token) return NextResponse.json({ error: '...' }, { status: 401 });
  const payload = await verifyUserToken(token);
  if (!payload) return NextResponse.json({ error: '...' }, { status: 401 });
  ```
  This is duplicated across: `orders/route.ts`, `orders/[id]/route.ts`, `wishlist/route.ts`, `notifications/route.ts`, `notifications/[id]/route.ts`, `coupons/validate/route.ts`, `products/[id]/reviews/route.ts` (POST), and more.
- **Suggestion:** Create a `requireUser(request)` helper in `src/lib/admin-auth.ts` (or a new `src/lib/user-auth.ts`) that mirrors the admin pattern:
  ```ts
  export async function requireUser(): Promise<{ ok: true; payload: UserTokenPayload } | { ok: false; response: NextResponse }> {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
    if (!token) return { ok: false, response: NextResponse.json({ error: 'لطفا وارد شوید' }, { status: 401 }) };
    const payload = await verifyUserToken(token);
    if (!payload) return { ok: false, response: NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 }) };
    return { ok: true, payload };
  }
  ```

#### R8 — Add rate limiting to POST routes that create user-generated content
- **Routes missing rate limits:**
  - `POST /api/wishlist` — No rate limit. A user can spam wishlist additions.
  - `POST /api/products/[id]/reviews` — No rate limit. Duplicate prevention exists but doesn't prevent request-flooding.
  - `POST /api/notifications` (mark-all-read) — No rate limit.
  - `POST /api/auth/update-profile` — No rate limit. A user can flood profile updates.
- **Suggestion:** Apply `RATE_LIMITS.normal` or `RATE_LIMITS.strict` keyed by `userId` to these endpoints.

#### R9 — `recordAudit` in admin settings route is fire-and-forget with no `await`
- **File:** `src/app/api/admin/settings/route.ts:30`
- **Problem:** `recordAudit(...)` is called without `await` and the function likely returns a Promise. If the audit DB write fails, it will produce an unhandled promise rejection. Unlike `recordAnalyticsEvent().catch(...)` which is deliberately fire-and-forget with error suppression, `recordAudit` has no `.catch()`.
- **Fix:** Either `await recordAudit(...)` or add `.catch(console.error)`.

#### R10 — AuthProvider creates a new context value object on every render
- **File:** `src/hooks/useAuth.tsx:74-89`
- **Problem:** The `AuthContext.Provider` value is an inline object literal `{{ user, isLoading, ... }}` created on every render. Unlike `CartContext` which correctly uses `useMemo` (line 287), `AuthProvider` does not memoize its value. This means **every child component** using `useAuth()` will re-render on every `AuthProvider` render, even if none of the auth values changed.
- **Impact:** Performance — this is the root provider, so unnecessary re-renders propagate to the entire app tree.
- **Fix:** Wrap the value in `useMemo`:
  ```ts
  const value = useMemo(() => ({
    user, isLoading, isAuthenticated: !!user,
    showAuthModal, authRedirectPath,
    openAuthModal, closeAuthModal, logout, refreshUser,
  }), [user, isLoading, showAuthModal, authRedirectPath, openAuthModal, closeAuthModal, logout, refreshUser]);
  ```

#### R11 — Wishlist GET endpoint has no pagination
- **File:** `src/app/api/wishlist/route.ts:28-44`
- **Observation:** The wishlist GET fetches all items with no `take` limit. While wishlists are typically small, a malicious user could add thousands of products to their wishlist and then hit this endpoint. Add `take: 100` as a safety cap.

#### R12 — `ImageUpload` component's `accept="image/*"` is wider than server-side allow-list
- **File:** `src/components/admin/ImageUpload.tsx:151`
- **Problem:** The client-side `<input accept="image/*">` allows selection of any image type (TIFF, BMP, SVG, etc.), but the server only accepts `image/jpeg`, `image/png`, `image/webp`, and `image/gif`. Users can select a TIFF/BMP file, see a local preview, wait for upload, and then get a rejection error.
- **Fix:** Narrow the accept attribute:
  ```html
  accept="image/jpeg,image/png,image/webp,image/gif"
  ```

#### R13 — Consider adding `Strict-Transport-Security` (HSTS) header
- **File:** `next.config.ts` (security headers block, line ~91)
- **Observation:** The security headers include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and CSP — but no `Strict-Transport-Security`. Since the site uses HTTPS in production (the CSP `connect-src` and cookie config confirm this), adding HSTS would prevent SSL-stripping attacks:
  ```ts
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  ```

---

### Updated Priority Matrix (new findings only)

| # | Item | Severity | Effort | Risk of fixing |
|---|---|---|---|---|
| 8 | Product PUT leaks error.message | 🔴 High | ~5 min | None |
| 9 | Admin login OTP race condition | 🟡 Medium | ~20 min | Low |
| 10 | Inconsistent getClientIp in analytics | 🟡 Medium | ~5 min | None |
| 11 | Product reviews unbounded GET | 🟡 Medium | ~5 min | None |
| 12 | SMS Content-Length string vs bytes | 🟢 Low | ~2 min | None |
| R7 | Centralize requireUser helper | 🟢 Low | ~30 min | None |
| R8 | Rate limit missing POST routes | 🟡 Medium | ~15 min | None |
| R9 | Audit call missing await/catch | 🟢 Low | ~2 min | None |
| R10 | AuthProvider missing useMemo | 🟡 Medium | ~5 min | None |
| R11 | Wishlist GET no pagination cap | 🟢 Low | ~5 min | None |
| R12 | ImageUpload accept too broad | 🟢 Low | ~2 min | None |
| R13 | Missing HSTS header | 🟡 Medium | ~2 min | None |

**Suggested order:** #8 (5 min, critical leak) → #10 + #12 + R9 (quick wins, ~10 min) → #9 (admin OTP race) → R10 + R13 (perf + security headers) → #11 + R11 (pagination caps) → R7 + R8 (refactoring)

---

### Second-Pass Final Word

The codebase continues to impress after a full second read. The original review was thorough and accurate — my corrections are minor (the proxy.ts middleware was already present). The new findings are mostly edge-case hardening and consistency fixes rather than structural flaws. The **most urgent fix** is Bug #8 (error message leakage in the product PUT route) which is a one-line change. The **highest-value improvement** is R10 (AuthProvider useMemo) which would reduce unnecessary re-renders across the entire app.

---

## 7. Third-Pass Review — by Antigravity (Gemini 3.1 Pro)

> **Date:** 2026-08-29 · **Reviewer:** Antigravity (Gemini 3.1 Pro)
> **Scope:** Targeted re-audit of database constraints, concurrency handling, and error handling.

### Corrections to Previous Reviews

#### C3 — Bug #8 Incomplete Scope (Product DELETE route also leaks errors)
- **File:** `src/app/api/products/[id]/route.ts:176`
- **Context:** The second-pass review correctly identified that the `PUT` handler leaks Prisma error messages via `getErrorMessage(error, '...')`. However, it incorrectly claimed the `DELETE` handler is safe.
- **Problem:** The `DELETE` handler also calls `message: getErrorMessage(error, 'خطا در حذف محصول')` at line 176, which will leak internal database error messages (like constraint violations) to the client on failure. Both handlers need the static message fix.

---

### 🐛 New Bugs Found (2)

#### Bug #13 — 🔴 Product Reviews TOCTOU Race Condition (Duplicate Reviews)
- **File:** `src/app/api/products/[id]/reviews/route.ts:93-100` and `prisma/schema.prisma`
- **Problem:** The POST route attempts to prevent duplicate reviews by querying the database (`findFirst`) before creating a new review (`create`). However, the `ProductReview` model in `schema.prisma` **lacks a `@@unique([userId, productId])` constraint**. If a user sends two concurrent POST requests, both will pass the `findFirst` check and proceed to `create`, resulting in duplicate reviews.
  *(Note: This differs from the Wishlist endpoint which has the same sequential logic, but WishlistItem safely relies on a `@@unique` constraint to block duplicates).*
- **Fix:** Add a composite unique constraint to the Prisma schema for `ProductReview`:
  ```prisma
  @@unique([productId, userId])
  ```

#### Bug #14 — 🟡 Unhandled JSON Parsing Errors Return 500 Instead of 400
- **Files:** Multiple (e.g., `src/app/api/auth/login/route.ts:11`, `src/app/api/auth/update-profile/route.ts:28`)
- **Problem:** When reading the request body via `await request.json()`, the call is inside a general `try...catch(error)` block. If a client sends an empty body or malformed JSON, `request.json()` throws a `SyntaxError`. The outer catch block handles it, but returns a generic `500 Internal Server Error` (with a message like "خطای سرور"). 
- **Impact:** Malformed client requests look like server crashes in monitoring/logs, and the client doesn't receive the proper `400 Bad Request` status code.
- **Fix:** Wrap `request.json()` calls in their own try-catch block, or check `error instanceof SyntaxError` in the global catch block to return a 400 status code.

### Third-Pass Final Word
The codebase uses database transactions efficiently to prevent race conditions during checkout and OTP validation. However, as demonstrated by Bug #13, application-level checks without database-level `@@unique` constraints are vulnerable to concurrent requests. The schema update is a critical fix to ensure data integrity for product reviews.

