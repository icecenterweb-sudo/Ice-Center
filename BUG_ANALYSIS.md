# Bug Analysis & Re-Review — Ice-Center Closing Pass

> Date: 2026-08-31 · Scope: re-analysis of the final closing-round code
> (Coupon admin panel, 8 static pages, profile discounts page, Sidebar nav)
> plus its integration points with the existing backend.

## 1. Verdict

The closing-round code is functionally sound. **One real bug was found and
fixed in this pass** (Section 2), **one dead import was cleaned up**
(Section 3), and the rest of the review confirmed correctness (Section 4).
All verification gates pass after the fixes:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Exit 0 — no type errors |
| `npx eslint src tests` | ✅ Exit 0 — 0 problems |
| `npm test` | ✅ **80 passed, 0 failed** (10 suites) |

---

## 2. Bug found & fixed — deleted coupon stayed visible in the admin list

**File:** `src/app/admin/dashboard/coupons/CouponsClient.tsx`,
`src/app/admin/dashboard/coupons/DeleteCouponButton.tsx`

**Problem:** `DeleteCouponButton` was copied from `DeleteOfferButton` and, on
success, called only `router.refresh()`. That works for the Offers page
because its table is **server-rendered** — refresh re-renders server
components and the deleted row disappears. The coupons list, however, is
**client-fetched** (state populated by `useEffect` + `fetch` inside
`CouponsClient`). `router.refresh()` only re-renders server components;
client component state survives it, and the `useEffect` fetch does not
re-run. Result: after confirming deletion, the deleted coupon **remained in
the table until a manual page reload** (the DELETE API call itself did
succeed — data integrity was never at risk, only the UI).

**Fix applied:**
- `DeleteCouponButton` now accepts an optional `onDeleted?: () => void`
  callback, invoked after a successful delete (still alongside
  `router.refresh()` for consistency with the Offers pattern). An explanatory
  comment documents why refresh alone is insufficient.
- `CouponsClient` passes
  `onDeleted={() => setCoupons(prev => prev.filter(c => c.id !== coupon.id))}`
  so the row is removed from local state immediately.

---

## 3. Cleanup — unused `React` import

**File:** `src/app/(shop)/profile/discounts/page.tsx`

After the Part C simplification removed the form state/handler, the
`import React from 'react'` became dead code (JSX uses the automatic
runtime). Neither `tsc` nor this project's ESLint config flags it (the
config only customizes `@typescript-eslint/no-explicit-any` and
`react-hooks/error-boundaries`), so it slipped through both gates. Removed
in this pass.

---

## 4. Verified correct (no action needed)

1. **FAQ payment claim is accurate** — no online payment gateway exists
   anywhere in the codebase (searched `zarinpal|idpay|zibal|درگاه`; the only
   match is the FAQ copy itself). Orders are confirmed/settled through the
   manual sales workflow (`PENDING → AWAITING_CONFIRMATION → PAID`).
2. **Profile discounts page copy matches reality** — checkout really has the
   «کد تخفیف» input in the order summary (`checkout/page.tsx:905`), validated
   server-side via `POST /api/coupons/validate` and re-validated inside the
   order transaction (`api/orders/route.ts`).
3. **Settings fields** — every `SiteSettings` field used by the 8 new pages
   (`siteTitle`, `phone`, `phoneFormatted`, `email`) exists in
   `src/types/settings.ts` and is consumed with safe `||` fallbacks, matching
   `Footer.tsx`'s pattern.
4. **Sidebar integration** — the coupons entry was appended as the **last**
   `menuItems` entry (index 14), so all pre-existing positional group
   references (`menuItems[10]`, etc.) remain correct; `COUPONS` exists in
   `ROLE_PERMISSIONS`, and the href was added to `PREFIX_ACTIVE_HREFS` so
   `/admin/dashboard/coupons/add` and `/[id]/edit` keep the item highlighted.
5. **Form ↔ server schema parity** — the add/edit coupon forms duplicate the
   server `couponSchema` / `couponUpdateSchema` messages exactly (required
   code, positive value, ≤100% cap, integer-positive limits). Server remains
   the source of truth; the client validation only prevents avoidable 400s.
6. **Type-switch edge case** — editing a coupon from PERCENTAGE to
   FIXED_AMOUNT hides the maxDiscount field and sends `maxDiscount: null`,
   which the server PATCH applies as a cleared cap. Correct.
7. **Decimal handling** — Prisma `Decimal` values serialize as strings in
   JSON; all UI consumers coerce via `Number()` before display/arithmetic.
8. **Prisma 7 + `cacheComponents` compatibility** — all new server pages use
   `connection()` (directly or via `getSiteSettings()`) before any
   DB/settings access, consistent with the rest of the codebase; metadata
   via `generateMetadata()` avoids the prerender-current-time pitfalls.

---

## 5. Observations (pre-existing patterns — documented, intentionally not changed)

- **Positional `menuItems[N]` grouping in Sidebar** — ✅ **FIXED in a follow-up
  pass.** `MENU_GROUPS` now resolves items by their unique `href` via a
  `getMenuItem()` lookup (fail-fast if an href is renamed) instead of array
  indexes, so inserting/reordering `menuItems` no longer silently regroups the
  navigation. Group membership/order preserved exactly.
- **Client-side duplication of server validation** in the coupon forms is
  intentional (better UX); if the server schema changes, both copies must be
  updated.
- **The `/contact` form is a client-side mock** (no submission endpoint), so
  `/complaints` was built as a static guidance page pointing to `/contact` +
  phone/email rather than a form. If a real contact endpoint is added later,
  `/complaints` is the natural place to reuse it.

---

## 6. Standing caveats & human action items (unchanged)

- **Placeholder legal content:** `/warranty`, `/return-policy`, `/privacy`,
  `/terms` contain original placeholder copy for structure only. Each file
  carries a non-user-facing code comment flagging this. **The site owner must
  review and finalize these before production.**
- **Melipayamak SMS API key** — still needs rotation in the Melipayamak
  dashboard if not already done (it lives in git history).
- **Before `prisma migrate deploy` against production** — confirm no
  duplicate `(productId, userId)` rows exist in `ProductReview`, or the new
  unique-constraint migration will fail.
- **Intentionally left as-is:** unused `Campaign` model, CSP
  `unsafe-inline`/`unsafe-eval`, `public/33311176.txt` (needs a human
  decision), and no new features beyond the closing-round scope.

---

*Nothing committed — all changes remain in the working tree for review.*
