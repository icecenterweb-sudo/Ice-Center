# UI/UX Standardization — Complete Report (All Phases)

**Project:** Ice-Center · Next.js App Router · Tailwind v4 · Persian/RTL
**Author:** Claude (ox-alpha) · **Date:** 2026-08-25
**Basis:** `UI_UX_AUDIT_REPORT.md` (two independent audits: 20 original findings DS1-8/IA1-3/UX1-3/A11Y1-4/RESP1-2 + my independent review NEW-1..8), executed via `prompt.txt` Phase 2 (Tasks 1–4) and this follow-up run completing every remaining item.

---

## Final verification (run after the last change)

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **EXIT 0** |
| Lint | `npx eslint src tests` | **0 errors** · 4 pre-existing warnings (AddProductForm unused vars ×3, FeaturesManager setState-in-effect) |
| Tests | `npm test` | **80 passed, 0 failed** |

---

## Phase 2 (executed earlier today) — recap

| Task | Fix | Files |
|---|---|---|
| T1 (DS3 part 1) | Created shared `StatusBadge` (`src/components/ui/StatusBadge.tsx`) — canonical style copied from OrdersClient; literal per-tone class map (Tailwind-safe); optional icon | 1 new |
| T2 (DS4) | `src/lib/order-status.ts` — single map for **all 12** OrderStatus values; migrated 5 views (OrdersClient, OrderDetailClient, CustomerProfileView, shop orders list + detail) | 6 |
| T3 (IA1+IA2) | Sidebar grouped into 5 labeled sections, operational-first order; role filter/collapse/mobile behavior preserved | 1 |
| T4 (NEW-1) | `.dir-ltr` utility defined in `globals.css` (was applied in 8 files but never existed) | 1 |

## Phase 3 (this run) — everything else from both audits

### Design System
- **DS3 completion** — remaining badge styles migrated to `StatusBadge`:
  - `CommentsTable.tsx`, `ReviewsTable.tsx`, `blog/page.tsx` (getColor fns → tone maps)
  - `ProductsTableClient.tsx` stock ternary → StatusBadge
  - `AdminsClient.tsx` role badges → StatusBadge via new `ROLE_TONE` map (+ added missing `amber` tone to StatusBadge; incidentally fixes invalid `border-*-150` classes that never existed in Tailwind)
  - `ErrorsView.tsx` row + detail severity badges → StatusBadge (config kept for card colors/icons)
- **DS1** — exact-match raw hexes replaced with tokens: `LoadingSpinner.tsx` `bg-[#FCFEFF]/35 → bg-ice-white/35`. Non-token hexes (`#0c2440`, `#102A43`, `#334E68`) intentionally left — no equal token exists.
- **DS2** — `DesktopNav.tsx`: 13× `hover:text-blue-600` → `hover:text-ocean`
- **DS5** — `form-classes.ts` gained `SETTINGS_FIELD_CLASS` (brand `ocean` focus); `SettingsClient.tsx` 13 controls (11 w-full + 2 flex-1) now use it — kills the ~13× duplication *and* the off-brand focus color
- **DS6** — 4 hand-rolled delete modals migrated to shared `ConfirmDialog`: `DeleteProductButton`, `DeleteCategoryButton`, `DeleteSubcategoryButton`, `VariantManager` (logic/toasts preserved; markup −~180 lines)
- **DS7** — `window.prompt` in BlogEditor: **checked first** — line 127 no longer contains `window.prompt` (already removed in an earlier batch); verified zero `window.prompt` remain project-wide. No change needed.
- **DS8 (decision made)** — orange admin accent is intentional → formalized: `--color-admin-accent` / `--color-admin-accent-dark` tokens added to `@theme`; gradual class adoption left to future edits.

### Information Architecture
- **NEW-3** — back-navigation added: `reviews/page.tsx` header ArrowLeft → products; `users/[id]/page.tsx` "بازگشت به کاربران" link. (`orders/[id]` already had one.)
- **NEW-4** — admin tab titles: layout-level `metadata.title` default+template, plus per-section titles on 11 server pages (client pages inherit template)

### Accessibility
- **A11Y1** — `role="dialog"` + `aria-modal="true"` + labelled-by on: `ConfirmDialog`, `AuthModal`, `InstallmentModal`, `MediaGalleryModal` (VariantManager/manual delete modals inherited it by becoming ConfirmDialog). Initial focus lands on Cancel in ConfirmDialog.
- **A11Y3** — 12 `aria-label`s added to icon-only admin action buttons (mirroring their existing Persian `title`s)
- **NEW-2** — body scroll-lock standardized via new `src/hooks/useBodyScrollLock.ts`; applied to ConfirmDialog, InstallmentModal, MediaGalleryModal

### UX Copy
- **UX1** — «بروزرسانی» → «به‌روزرسانی»: **30 occurrences across 24 files**
- **UX2** — generic error phrases unified to «خطایی رخ داد. لطفاً دوباره تلاش کنید» in 7 files (contextual errors like «خطا در حذف…» deliberately kept)

### Conventions documented (zero-risk)
- **NEW-7/NEW-8** — radius roles + z-index ladder written as a convention comment block in `globals.css`

## 🔴 New confirmed bug found during IA3 work

**Dead navigation links → 404s.** Routes `/about`, `/warranty`, `/corporate` do not exist anywhere under `src/app/**`, yet are linked from:
- `src/components/layout/Footer.tsx:89,91,92`
- `src/components/layout/DesktopNav.tsx:71,79` («خرید سازمانی», «گارانتی و خدمات»)
- `src/components/layout/MobileMenu.tsx:200` (`/about`)

**Why IA3 wasn't blindly "unified":** propagating these hrefs to the other nav would have *added* more 404s. Real fix needs either three content pages or temporarily removing the links — a content decision, flagged here as the top remaining item.

## Decisions made autonomously (as authorized)

| Item | Decision |
|---|---|
| DS8 | Intentional split → tokenized (`admin-accent`) |
| RESP1 | Keep Suspense-inline pattern for admin loading (server pages already provide per-page fallbacks); no loading.tsx sweep |
| NEW-5 spinner fragmentation | Accepted for now — mass-swapping 97 inline spinners risks visual regressions; LoadingSpinner remains available |
| NEW-6 touch targets | aria-labels shipped (A11Y3); size bump deferred to avoid table-row height churn |
| NEW-7/NEW-8 | Solved as documented conventions, not mass refactors |
| InstallmentModal | Untouched — respects your prior decision that its flow is intentional until the real installment backend exists |

## Remaining (accepted / follow-up)

1. **Dead `/about` `/warranty` `/corporate` links** (above) — build pages or prune links
2. #12-related runtime follow-up: run `npx prisma migrate deploy` on next VPS deploy (Decimal + index drops + trigram indexes)
3. Cosmetic backlog: NEW-5 spinners, NEW-6 sizes, NEW-7 legacy hex variants (`#102A43/#334E68/#0c2440`)
4. Pre-existing lint warnings ×4 (AddProductForm ×3, FeaturesManager effect)

## Git status

All phases remain **uncommitted** — say the word and everything gets committed in clean, labeled commits.
