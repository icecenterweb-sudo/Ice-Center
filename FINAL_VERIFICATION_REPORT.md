# FINAL VERIFICATION REPORT — Ice-Center

**Type:** Independent, skeptical, audit-only verification pass. No source code was modified; this file is the only write.
**Date:** 2026-08-26
**HEAD:** `a3c1feb`
**Method:** Every claim in the four `.md` reports was inventoried and checked against the *current* code. Backend findings were confirmed by (a) locating the commit in `git log`, (b) re-running the 80-test regression suite this session, and (c) targeted code reads with file:line evidence. UI/UX findings were confirmed by direct reads of the working tree this session. Toolchain commands were re-run from scratch — no number is copied from an older report.

**Confidence labels (used exactly as defined):**
- ✅ **Confirmed fixed** — personally verified AND committed to git.
- ⚠️ **Fixed but uncommitted** — correct in the working tree, not in git history.
- ❓ **Uncertain** — might be a problem, or could not be fully verified.
- ❌ **Not actually fixed / still broken** — concrete evidence.

**Source reports inventoried** (all four are untracked `.md` files at project root):
`COMPLETE_FIX_REPORT.md` (backend findings #1–#34), `UI_UX_AUDIT_REPORT.md` (original UI/UX findings), `UI_UX_PHASE2_REPORT.md` (Phase 2 T1–T4), `UI_UX_STANDARDIZATION_ALL_PHASES.md` (the consolidated UI/UX claims — "ox-alpha").

**Headline:** The entire backend batch (#1–#34) is real, committed, and test-backed. **All** UI/UX work is correct-but-uncommitted **except two claims that are false**: DS5 (settings field styling — 11 of 13 controls broken) and DS7 (window.prompt "removed" — 5 live calls remain). Several genuine issues were found that no report claims (dead nav links wider than reported, untracked migrations = deploy risk, a missing placeholder asset, a dead JSON-LD module).

---

## Section 1 — Summary table (one row per claim)

### Backend findings (`COMPLETE_FIX_REPORT.md` / commit messages) — all committed

| # | Claim | Source | Confidence | Evidence pointer |
|---|---|---|---|---|
| #1 | Offer pricing uses `product.price` as base; cap=0 clamps to zero | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/pricing.ts:186`; commit `a88c482`; test "Batch1 #1" (10 pass) |
| #13 | Order unit price nullish-safe (`??`, real 0 survives) | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/pricing.ts:244-249`; `a88c482`; test "Batch1 #13" |
| #4 | Review moderation lifecycle in one `$transaction`, aggregate recompute | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/reviews.ts:61-100`; commit `4f329f0`; test "Batch1 #4" (9 pass) |
| #5/#6/B2 | Centralized cache invalidation + atomic Redis versioning + `brands:` tag | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/cache/invalidation.ts`; commit `4dc8cdb`; test "Batch 2 #5/#6/B2" |
| #7/#8/#21/L2 | Cart login-sync race, pure updaters, stock clamp | COMPLETE_FIX | ✅ Confirmed fixed | `src/context/CartContext.tsx`; commit `c259a76`; test "Batch 2 #7/#8/#21" |
| #9/L1 | Coupon validation unified + atomic row locking | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/coupons.ts`; `src/app/api/orders/route.ts` `$transaction`; commit `eb587ad`; test "Batch 2 #9" (10 pass) |
| #16/#31/#34(auth) | OTP sha256 hash, attempt caps, admin login limit, RBAC | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/otp.ts`; commit `113d779`; test "Batch 2 #31/#16" |
| #18 | Canonical slug policy (Persian + digits), unique-slug generation | COMPLETE_FIX | ✅ Confirmed fixed | commit `df25c1d`; test "Batch 3 #18" (8 pass) |
| #17 | Category DB-side filtering + pagination | COMPLETE_FIX | ✅ Confirmed fixed | test "Batch 3 #17"; committed |
| #20 | Search stale-response race protection (seq token + AbortController) | COMPLETE_FIX | ✅ Confirmed fixed | `src/components/.../SearchBar.tsx`; commit `43a7c6b`; test "Batch 3 #20" |
| #19 | Checkout form isolation (`getValues`, no top-level `watch`) | COMPLETE_FIX | ✅ Confirmed fixed | `src/app/(shop)/checkout/page.tsx:377`; **committed via `f56078a`** (see note); test "Batch 3 #19" |
| #24 | Checkout `CHECKOUT_START` once + ScrollToTop popstate | COMPLETE_FIX | ✅ Confirmed fixed | commit `43a7c6b`; test "Batch 3 #24" |
| #25 | Homepage static + tagged caching | COMPLETE_FIX | ✅ Confirmed fixed | test "Batch 3 #25"; committed |
| #23 | Time-based offer freshness independent of cron | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/pricing.ts` `getProductPricing`; test "Batch 2 #23" (runtime path wired; standalone `isOfferActive` is test-only) |
| #12/#32 | Monetary fields Float → `@db.Decimal(14,2)` | COMPLETE_FIX | ✅ Confirmed fixed | `prisma/schema.prisma`; commit `39e7376`; test "Finding #12" (10 pass) |
| #2 | `clear-db.js` confirmation prompt + remote warning | COMPLETE_FIX | ✅ Confirmed fixed | commit `5915b29`; agent read `scripts/clear-db.js` |
| #3 | Destructive deletions removed from scripts | COMPLETE_FIX | ✅ Confirmed fixed | commit `5915b29`; `count-total.ts` now read-only |
| #34(scripts) | `pack-vps.ps1` no longer bundles `.env`; `migrate deploy` | COMPLETE_FIX | ✅ Confirmed fixed | commit `5915b29` |
| #10 | Wishlist guest prompt + error-revert on failed toggle | COMPLETE_FIX | ✅ Confirmed fixed | `src/components/product/WishlistButton.tsx:28`, `src/context/WishlistContext.tsx:90`; commit `43a7c6b` |
| #11 | "Component/image optimization" | COMPLETE_FIX | ❓ Uncertain | Code changes exist & committed (HeroCarousel LCP `priority` on `index===0`; ScrollDriftIcon) but **no `#11` tag exists anywhere** in code/tests/docs — the finding→code mapping is inferred, not confirmed |
| #28 | Site-settings single-flight (shared promise) | COMPLETE_FIX | ✅ Confirmed fixed | `src/hooks/useSiteSettings.ts:6`; commit `43a7c6b` |
| #33 | Shared `useClickOutside` + dedup effects | COMPLETE_FIX | ✅ Confirmed fixed | `src/hooks/useClickOutside.ts` + 3 call sites; commit `43a7c6b` |
| B1 | JSON-LD prices in IRR (`tomanToIrr`) | COMPLETE_FIX | ✅ Confirmed fixed | `src/lib/currency.ts:7`; emitted on 4 live surfaces; commit `43a7c6b`; test "Batch 2 B1" (see §3 dead-module note) |
| RBAC | Role guards across all admin sections | COMPLETE_FIX | ✅ Confirmed fixed | commit `f66fba7`; `src/lib/admin-auth.ts` |
| Dead-component cleanup | 7 unused components deleted, zero dangling imports | COMPLETE_FIX | ✅ Confirmed fixed | commit `43a7c6b` (7 `delete mode`); grep for deleted paths = 0 |

### UI/UX findings (`UI_UX_STANDARDIZATION_ALL_PHASES.md`) — all uncommitted working tree

| ID | Claim | Confidence | Evidence pointer |
|---|---|---|---|
| DS3 (component + wiring) | Shared `StatusBadge`, literal tone classes, 5 consumers wired | ⚠️ Fixed but uncommitted | `src/components/ui/StatusBadge.tsx` (untracked `??`); 5 consumers `M` |
| DS3 (border-150 sub-claim) | "incidentally fixes invalid `border-*-150` classes" | ❌ Not actually fixed | `border-*-150` still live: `AdminsClient.tsx:55-61,346,463` + ErrorsView/Analytics/DashboardView; no `-150` shade exists |
| DS4 | `order-status.ts` single source, all 12 statuses, 5 consumers migrated | ⚠️ Fixed but uncommitted | `src/lib/order-status.ts` (`??`); 5 consumers `M` (straggler: §3 item 6) |
| DS1 | LoadingSpinner `bg-[#FCFEFF]/35` → `bg-ice-white/35` | ⚠️ Fixed but uncommitted | `src/components/ui/LoadingSpinner.tsx:10` (`M`); `#FCFEFF` count = 0 |
| DS2 | DesktopNav 13× `hover:text-blue-600` → `hover:text-ocean` | ⚠️ Fixed but uncommitted | `src/components/layout/DesktopNav.tsx` (`M`); `blue-600`=0, `ocean`=13 |
| DS5 | `SETTINGS_FIELD_CLASS` applied to 13 settings controls | ❌ Not actually fixed | **11 of 13 controls broken**: `SettingsClient.tsx:225,248,286,298,310,324,336,349,376,388,404` use double-quoted `"...${SETTINGS_FIELD_CLASS}..."` (no JSX interpolation). Only `:198,:210` correct |
| DS6 | 4 delete modals → shared `ConfirmDialog` | ⚠️ Fixed but uncommitted | DeleteProduct/Category/Subcategory + VariantManager (`M`) |
| DS7 | "`window.prompt` removed; zero remain project-wide" | ❌ Not actually fixed | **5 live calls**: `src/components/blog/BlogEditor.tsx:94,101,108,127,140` (committed) |
| DS8 | `--color-admin-accent` tokens added to `@theme` | ⚠️ Fixed but uncommitted | `src/app/globals.css:30-31` (`M`) |
| IA1/IA2 | Sidebar grouped into 5 labeled sections, operational-first | ⚠️ Fixed but uncommitted | `src/components/admin/Sidebar.tsx:50-86` (`M`) |
| Sidebar isActive | Single-active-item regression fixed (`PREFIX_ACTIVE_HREFS`) | ⚠️ Fixed but uncommitted | `Sidebar.tsx:93-101,183-184` (`M`) |
| NEW-1 | `.dir-ltr` utility defined (was used, never defined) | ⚠️ Fixed but uncommitted | `src/app/globals.css:62-66` (`M`); used in 11 files |
| NEW-2 | `useBodyScrollLock` hook, applied to 3 modals | ⚠️ Fixed but uncommitted | `src/hooks/useBodyScrollLock.ts` (`??`); called ConfirmDialog:57, MediaGalleryModal:41, InstallmentModal:17 — **wired, not dead** |
| NEW-3 | Back-navigation links on reviews + users/[id] | ⚠️ Fixed but uncommitted | `reviews/page.tsx:44-50`, `users/[id]/page.tsx:194-200` (`M`) |
| NEW-4 | Admin metadata titles (default + template) | ⚠️ Fixed but uncommitted | `admin/dashboard/layout.tsx:3-5` + 13 pages (`M`) |
| A11Y1 | `role/aria-modal/aria-labelledby` on 4 modals | ⚠️ Fixed but uncommitted | ConfirmDialog/AuthModal/InstallmentModal/MediaGalleryModal (`M`) |
| A11Y3 | ~12 `aria-label`s on admin icon buttons | ⚠️ Fixed but uncommitted | 16 found across 10 files (claim exceeded) (`M`) |
| UX1 | «بروزرسانی» → «به‌روزرسانی» | ⚠️ Fixed but uncommitted | old spelling = 0; new = 39 across 29 files (`M`) |
| UX2 | Generic error phrase unified across ~7 files | ⚠️ Fixed but uncommitted | Phrase in **4 files** not ~7: AuthModal:104, ProductsTableClient:162, OrdersClient:113, AdminsClient:123 — count overstated, fix correct |
| NEW-7/8 | Radius + z-index convention comment block | ⚠️ Fixed but uncommitted | `src/app/globals.css:40-47` (`M`, doc-only) |
| IA3 | Dead nav links flagged as top remaining item (3 routes) | ❌ Not actually fixed | Still broken and **wider than reported** — 8 dead links (see §2/§3 item 2) |

---

## Section 2 — ❌ and ❓ items in detail

### ❌ DS7 — "window.prompt removed; zero remain project-wide" is FALSE
`UI_UX_STANDARDIZATION_ALL_PHASES.md:40` claims: *"line 127 no longer contains window.prompt (already removed in an earlier batch); verified zero window.prompt remain project-wide. No change needed."*

**Reality — 5 live calls, all in committed code** (`src/components/blog/BlogEditor.tsx`):
- `:94` `const url = window.prompt('آدرس تصویر را وارد کنید:');`
- `:101` `const url = window.prompt('آدرس لینک را وارد کنید:');`
- `:108` `const slug = window.prompt('اسلاگ محصول را وارد کنید ...);`
- `:127` `const name = window.prompt('محصول یافت نشد. نام محصول را وارد کنید:') ...`
- `:140` `const name = window.prompt('خطا در دریافت اطلاعات محصول. ...') ...`

The file is clean/committed (not in `git status`), so this is not an uncommitted regression — the claim was simply never true. This is exactly the "claimed fixed without evidence" pattern to watch for.

### ❌ DS5 — `SETTINGS_FIELD_CLASS` is not applied to 11 of 13 controls
The helper is correct (`src/lib/form-classes.ts` defines `SETTINGS_FIELD_CLASS` with `focus:border-ocean`) and `SettingsClient.tsx` imports it. But interpolation is broken on 11 of 13 controls:
- **Correct (2):** `:198` and `:210` — `className={\`w-full ${SETTINGS_FIELD_CLASS}\`}` (backtick template literal inside a JSX expression).
- **Broken (11):** `:225, :248, :286, :298, :310, :324, :336, :349, :376, :388, :404` — e.g. `:225` `className="flex-1 ${SETTINGS_FIELD_CLASS} dir-ltr"`. A **double-quoted** JSX attribute is a literal string: `${SETTINGS_FIELD_CLASS}` is emitted verbatim as a class token and never expands, so the shared style (radius/background/border/`focus:border-ocean`) is not applied to those inputs. `focus:border-blue-600` count is 0 (the off-brand color was removed), so the visual regression is "no shared field style" rather than "wrong color." Uncommitted (`SettingsClient.tsx` is `M`).

### ❌ DS3 sub-claim — invalid `border-*-150` classes were NOT eliminated
`UI_UX_STANDARDIZATION_ALL_PHASES.md:34` claims the AdminsClient migration *"incidentally fixes invalid border-*-150 classes that never existed in Tailwind."* They are still present in live code:
- `src/app/admin/dashboard/admins/AdminsClient.tsx:55-61` — `roleConfigs` map with `border-red-150`, `border-purple-150`, `border-emerald-150`, `border-blue-150`, `border-amber-150`, `border-gray-150`, `border-cyan-150` (rendered on the role-selection cards).
- `AdminsClient.tsx:346` and `:463` — `border-gray-150`.
- Also present (per cross-file grep) in `errors/ErrorsView.tsx`, `analytics/AnalyticsDashboard.tsx`, `(shop)/page.tsx`, and `admin/dashboard/DashboardView.tsx`.
Tailwind's default palette has no `-150` shade, so these produce no border color. The main DS3 claim (shared `StatusBadge` created + 5 consumers wired) is genuine and ⚠️ uncommitted; only this cleanup sub-claim is false.

### ❌ IA3 — dead navigation links still broken, and broader than reported
See §3 item 2. The report acknowledged only `/about`, `/warranty`, `/corporate` (3). There are 8 dead footer links; the extra 5 were never disclosed. Listed under §2 because the report presented IA3 as a known "top remaining item" — it remains unfixed.

### ❓ #11 — identity unverified
`43a7c6b`'s message credits "Finding #11" but no `#11` marker exists anywhere in code, tests, or docs. The only unattributed "optimize components" changes in that commit (HeroCarousel `priority`-on-first-image LCP fix; ScrollDriftIcon reduced-motion) are committed and correct, but whether they *are* what "#11" meant cannot be confirmed. The code is fine; the claim's identity is uncertain.

---

## Section 3 — Newly discovered issues (not claimed by any report)

**1. ❌ Untracked Prisma migrations — real deployment risk.**
Two migration directories are untracked (`git status`): `prisma/migrations/20260825090000_drop_redundant_unique_indexes/` and `prisma/migrations/20260825120000_add_trigram_search_indexes/`. `prisma/schema.prisma` is committed and reflects the end-state, but the trigram work is raw SQL (`CREATE EXTENSION pg_trgm` + GIN `gin_trgm_ops`) that lives only in the untracked migration, not in the schema. A git-based deploy followed by `prisma migrate deploy` would **not** ship either migration → trigram search indexes never created (search degrades to sequential scans), redundant unique indexes never dropped, and `migrate status` drift. `UI_UX_STANDARDIZATION_ALL_PHASES.md:82` mentions running `migrate deploy` but not that the migrations are uncommitted.

**2. ❌ Dead navigation links — 8 in the footer, not 3.**
Routes confirmed non-existent under `src/app/**` (checked directly): `/about`, `/warranty`, `/corporate`, `/faq`, `/return-policy`, `/privacy`, `/terms`, `/complaints`. (`/contact` and `/blog` **do** exist.)
- `src/components/layout/Footer.tsx` (committed): `:77` `/faq`, `:78` `/return-policy`, `:79` `/privacy`, `:80` `/terms`, `:81` `/complaints`, `:89` `/about`, `:91` `/warranty`, `:92` `/corporate` → **8 dead links**. Only the last 3 were disclosed.
- `src/components/layout/DesktopNav.tsx:71,79` (uncommitted `M`): `/corporate`, `/warranty`.
- `src/components/layout/MobileMenu.tsx:200` (committed): `/about`.
All resolve to 404s.

**3. ❌ Missing placeholder asset.**
`src/components/home/OfferCarousel.tsx:227` and `:340` use `src={product.image || '/images/placeholder-product.png'}`. `public/images/` does not exist and there is no `placeholder-product.*` anywhere under `public/` (only `public/uploads/**`). Any offer product without an image renders a broken/404 image. Committed.

**4. ❌ Dead JSON-LD module.**
`src/lib/seo/jsonld.ts` exports `generateProductJsonLd`, `generateCollectionPageJsonLd`, `generateCategoryJsonLd`, `generateBreadcrumbJsonLd`, which reference only each other (`:66, :101, :102`). There is **no `@/lib/seo/jsonld` importer anywhere in `src/`**. The live IRR JSON-LD on the four surfaces is emitted by a different function (`generateProductSchemaJsonLd`) plus inline `tomanToIrr`, so B1's outcome is genuinely wired — but the specifically-named `generateProductJsonLd` is runtime-dead (referenced only by the test). Not a regression; a cleanup the "clean dead components" commit missed.

**5. ❌ Order-status labels duplicated outside the single source.**
`src/app/admin/dashboard/DashboardView.tsx:64` defines its own `const statusLabels: Record<string, string>` (used at `:527`), separate from `src/lib/order-status.ts`. DS4 only claimed the 5 consumers it migrated, so this is not a false claim — but it is the "two files handling the same concept inconsistently" pattern, and being `Record<string, string>` it has no compile-time completeness guarantee against the 12-value enum.

**6. ❌ Decorative discounts form.**
`src/app/(shop)/profile/discounts/page.tsx` renders a coupon input whose submit handler only toasts "apply it at checkout" and never validates or persists anything — a non-functional control. Cosmetic; low severity.

**7. ❓ Commit message overstatement (bookkeeping).**
`43a7c6b`'s message credits "#19" but the checkout form-isolation change actually landed in `f56078a` ("feat(forms): add inline validation to blog, checkout, profile, and contact forms"). Separately, `1a4fc42` ("fix(lint): eliminate all remaining warnings") is overstated — 4 warnings remain (see §4). Both are message-accuracy issues only; the underlying code is committed and correct.

### Deferred items confirmed still-open / memory corrections
- **Coupons — quietly built (contradicts prior "unbuilt" note).** End-to-end and committed: `checkout/page.tsx` (state, `handleApplyCoupon`, `POST /api/coupons/validate`, order submit) + `orders/route.ts` atomic re-validation/increment.
- **Reviews — quietly built (contradicts prior "unbuilt" note).** `src/components/.../ProductReviews.tsx` POSTs to `/api/products/[id]/reviews`; moderation pipeline committed as #4.
- **Shipping — still flat constants.** `SHIPPING_COST` / `FREE_SHIPPING_THRESHOLD` in `@/lib/shipping`; not a configurable feature. Matches the "not built as a feature" expectation.
- **`window.confirm` — quietly fixed.** Only a doc-comment mention remains (`ConfirmDialog.tsx`).
- **`logSystemError` is NOT dead code.** Called at ~11 sites (search, cron routes, orders, upload, verify-otp, send-otp, admin login); the errors dashboard reads `prisma.errorLog`. The "logging function that existed but was never called" failure mode is not present here.

---

## Section 4 — Actual toolchain output (re-run this session)

### `npm test`
```
==== TOTAL: 80 passed, 0 failed ========================
NPMTEST_EXIT=0
```
80/80 across Batch1 (#1, #13, #4), Batch2 (#5/#6/B2, #9, #7/#8/#21, #23, #31/#16, B1), Batch3 (#18, #17, #20, #19, #24, #25), and Finding #12 (Decimal). All PASS; no failures or skips.

### `npx tsc --noEmit`
```
TSC_EXIT=0
```
No type errors (zero diagnostic lines emitted).

### `npx eslint src tests`
```
C:\...\src\app\admin\dashboard\products\add\AddProductForm.tsx
  36:12  warning  'imageUrls' is assigned a value but never used       @typescript-eslint/no-unused-vars
  37:12  warning  'features' is assigned a value but never used        @typescript-eslint/no-unused-vars
  38:12  warning  'specifications' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\...\src\components\admin\FeaturesManager.tsx
  153:13  warning  Error: Calling setState synchronously within an effect can trigger cascading renders
  ... react-hooks/set-state-in-effect

✖ 4 problems (0 errors, 4 warnings)
ESLINT_EXIT=0
```
0 errors, 4 pre-existing warnings (3× unused-vars in `AddProductForm.tsx`, 1× set-state-in-effect in `FeaturesManager.tsx:153`). These 4 are acknowledged as pre-existing in the UI/UX report; note `1a4fc42`'s "eliminate all remaining warnings" message is therefore inaccurate.

---

## Section 5 — Git state (verbatim)

### `git log --oneline -30`
```
a3c1feb docs: update README with tech stack, verification commands, migration workflow, and local uploads
718c94c test: add permanent regression test suites covering all audited batches and decimal migration
43a7c6b perf(frontend): optimize components, search bar, scroll and clean dead components (Finding #10, #11, #19, #20, #24, #28, #33, B1)
39e7376 feat(database): migrate monetary fields from Float to Decimal (Finding #12, #32)
df25c1d refactor(slugs): unify canonical slug policy with Persian and digit support (Finding #18)
113d779 fix(auth): harden OTP verification, enforce admin login attempts and RBAC (Finding #16, #31, #34)
eb587ad fix(coupons): unify coupon validation and add atomic row locking (Finding #9, L1)
c259a76 fix(cart): resolve login sync race, enforce state purity, and clamp stock (Finding #7, #8, #21, L2)
4dc8cdb fix(cache): centralize cache invalidation, add atomic Redis versioning and brands tag (Finding #5, #6, B2)
4f329f0 feat(reviews): add admin review moderation pipeline and dynamic rating calculation (Finding #4)
5915b29 fix(scripts): add confirmation to clear-db, remove destructive deletions and harden pack-vps (Finding #2, #3, #34)
a88c482 fix(pricing): correct offer base price, cap handling and resolve unit price (Finding #1, #13)
d1a8049 feat: add FeaturesManager component for creating and reordering product features via drag-and-drop
ac0ab3c style(admin/products): remove drag-and-drop badge from FeaturesManager header
260c891 feat(admin/products): add smooth drag-and-drop reordering to product features via dnd-kit
d04a6f4 fix(actions): remove ActionResult type re-export from use-server modules
6e377cb feat(home): reorder TopProductsSection to place ice cream and batch freezers before juicers
3a16f54 feat(admin/categories): add order input controls, badges, and sorting
a9498c0 feat(categories): add order field to schema, actions, and API queries
f56078a feat(forms): add inline validation to blog, checkout, profile, and contact forms
3960d2b feat(admin/appearance): add inline field validation for slides, banners, and offers
a26c364 feat(admin/products): add inline field validation for products, variants, and categories
8f7d187 feat(core): add fieldClass helper and ActionResult fieldErrors support
7e557bd fix(offers-coupons-settings): fix timezone shift, cap discounts, validate links and allowlist settings
f66fba7 security(rbac): enforce role guards across orders, users, analytics, support, appearance, blog and admin promotion
20cce0a feat(admin-ui): introduce ConfirmDialog component, add css keyframes and modernize dialogs
f1fafca fix(admin-categories): add persian auto-slugging and standardize category actions
3d1cab3 fix(admin-products): standardize product actions, persist slugs and add toast handling
298d5d3 fix(core): add action-result helper, persian slug utilities and json-ld escaping
7688cfc feat: implement admin authentication flow and dynamic site settings management system
```

### `git status`
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   src/app/(shop)/profile/edit/page.tsx
	modified:   src/app/(shop)/profile/orders/[id]/page.tsx
	modified:   src/app/(shop)/profile/orders/page.tsx
	modified:   src/app/actions/products.ts
	modified:   src/app/admin/dashboard/DashboardView.tsx
	modified:   src/app/admin/dashboard/admins/AdminsClient.tsx
	modified:   src/app/admin/dashboard/admins/page.tsx
	modified:   src/app/admin/dashboard/analytics/page.tsx
	modified:   src/app/admin/dashboard/appearance/page.tsx
	modified:   src/app/admin/dashboard/appearance/slides/[id]/edit/EditSlideClient.tsx
	modified:   src/app/admin/dashboard/blog/[id]/edit/EditPostForm.tsx
	modified:   src/app/admin/dashboard/blog/[id]/edit/page.tsx
	modified:   src/app/admin/dashboard/blog/comments/CommentActions.tsx
	modified:   src/app/admin/dashboard/blog/comments/CommentsTable.tsx
	modified:   src/app/admin/dashboard/blog/new/page.tsx
	modified:   src/app/admin/dashboard/blog/page.tsx
	modified:   src/app/admin/dashboard/categories/DeleteCategoryButton.tsx
	modified:   src/app/admin/dashboard/categories/DeleteSubcategoryButton.tsx
	modified:   src/app/admin/dashboard/categories/add/page.tsx
	modified:   src/app/admin/dashboard/categories/edit/[id]/EditCategoryForm.tsx
	modified:   src/app/admin/dashboard/categories/edit/[id]/page.tsx
	modified:   src/app/admin/dashboard/categories/page.tsx
	modified:   src/app/admin/dashboard/categories/subcategories/add/page.tsx
	modified:   src/app/admin/dashboard/categories/subcategories/edit/[id]/EditSubcategoryForm.tsx
	modified:   src/app/admin/dashboard/categories/subcategories/edit/[id]/page.tsx
	modified:   src/app/admin/dashboard/errors/ErrorsView.tsx
	modified:   src/app/admin/dashboard/errors/page.tsx
	modified:   src/app/admin/dashboard/layout.tsx
	modified:   src/app/admin/dashboard/offers/[id]/edit/EditOfferClient.tsx
	modified:   src/app/admin/dashboard/offers/page.tsx
	modified:   src/app/admin/dashboard/orders/OrdersClient.tsx
	modified:   src/app/admin/dashboard/orders/[id]/OrderDetailClient.tsx
	modified:   src/app/admin/dashboard/orders/[id]/page.tsx
	modified:   src/app/admin/dashboard/orders/actions.ts
	modified:   src/app/admin/dashboard/orders/page.tsx
	modified:   src/app/admin/dashboard/page.tsx
	modified:   src/app/admin/dashboard/products/DeleteProductButton.tsx
	modified:   src/app/admin/dashboard/products/ProductsTableClient.tsx
	modified:   src/app/admin/dashboard/products/[id]/edit/VariantManager.tsx
	modified:   src/app/admin/dashboard/products/[id]/edit/page.tsx
	modified:   src/app/admin/dashboard/products/[id]/page.tsx
	modified:   src/app/admin/dashboard/products/add/page.tsx
	modified:   src/app/admin/dashboard/products/page.tsx
	modified:   src/app/admin/dashboard/reviews/ReviewActions.tsx
	modified:   src/app/admin/dashboard/reviews/ReviewsTable.tsx
	modified:   src/app/admin/dashboard/reviews/page.tsx
	modified:   src/app/admin/dashboard/settings/SettingsClient.tsx
	modified:   src/app/admin/dashboard/support/SupportClient.tsx
	modified:   src/app/admin/dashboard/users/[id]/CustomerProfileView.tsx
	modified:   src/app/admin/dashboard/users/[id]/page.tsx
	modified:   src/app/admin/dashboard/users/page.tsx
	modified:   src/app/api/admin/auth/login/route.ts
	modified:   src/app/api/admin/banners/[id]/route.ts
	modified:   src/app/api/admin/blog/comments/[id]/route.ts
	modified:   src/app/api/admin/reviews/[id]/route.ts
	modified:   src/app/api/auth/send-otp/route.ts
	modified:   src/app/api/auth/update-profile/route.ts
	modified:   src/app/api/auth/verify-otp/route.ts
	modified:   src/app/api/blog/[slug]/route.ts
	modified:   src/app/api/cart/update/route.ts
	modified:   src/app/api/cron/abandoned-carts/route.ts
	modified:   src/app/api/cron/cleanup-otps/route.ts
	modified:   src/app/api/cron/sync-offers/route.ts
	modified:   src/app/api/offers/[id]/route.ts
	modified:   src/app/api/orders/route.ts
	modified:   src/app/api/products/route.ts
	modified:   src/app/api/search/route.ts
	modified:   src/app/api/slides/[id]/route.ts
	modified:   src/app/api/upload/route.ts
	modified:   src/app/globals.css
	modified:   src/components/admin/ConfirmDialog.tsx
	modified:   src/components/admin/MediaGalleryModal.tsx
	modified:   src/components/admin/Sidebar.tsx
	modified:   src/components/auth/AuthModal.tsx
	modified:   src/components/layout/DesktopNav.tsx
	modified:   src/components/modals/InstallmentModal.tsx
	modified:   src/components/ui/LoadingSpinner.tsx
	modified:   src/context/CartContext.tsx
	modified:   src/lib/form-classes.ts
	modified:   src/lib/rate-limiter.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	COMPLETE_FIX_REPORT.md
	UI_UX_AUDIT_REPORT.md
	UI_UX_PHASE2_REPORT.md
	UI_UX_STANDARDIZATION_ALL_PHASES.md
	prisma/migrations/20260825090000_drop_redundant_unique_indexes/
	prisma/migrations/20260825120000_add_trigram_search_indexes/
	prompt.txt
	src/components/ui/StatusBadge.tsx
	src/hooks/useBodyScrollLock.ts
	src/lib/order-status.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

**Committed vs uncommitted, at a glance:**
- **Committed (git history):** all backend findings #1–#34 (`a88c482`…`a3c1feb` plus earlier `f66fba7`, `f56078a`); the false-claim files `BlogEditor.tsx` (window.prompt) and `Footer.tsx` (dead links) and `OfferCarousel.tsx` (missing placeholder) are also committed.
- **Uncommitted (working tree only):** every UI/UX design-system change (StatusBadge, order-status, useBodyScrollLock — all untracked; ~80 modified files including Sidebar, globals.css, SettingsClient, AdminsClient, DesktopNav), and the two Prisma migration directories (untracked = the deploy risk in §3 item 1).
```
