# Ice Center

Next.js 16 ecommerce & admin platform built with React 19, Prisma 7, PostgreSQL (with strict `Decimal(14,2)` financial precision), local media management, Melipayamak OTP authentication, atomic Upstash Redis cache invalidation, and automated maintenance workflows.

---

## 🛠️ Tech Stack & Key Features

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (Strict)
- **ORM & Database**: Prisma 7 + PostgreSQL (`Decimal` money fields, ACID checkout with `SELECT FOR UPDATE` row locks)
- **Caching**: Centralized tag-based cache invalidation (`invalidation.ts`) + Upstash Redis atomic versioning (`products:version`)
- **Authentication**: JWT authentication with SHA-256 hashed OTPs, attempt limiting, and role-based access control (RBAC)
- **Reviews Engine**: Product review moderation pipeline (`/admin/dashboard/reviews`) with transactional aggregate rating recalculation
- **SEO**: Structured data (JSON-LD in IRR currency), canonical slug validation with Persian & ZWNJ normalization

---

## 🚀 Local Development

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database
- Optional: Upstash Redis instance

### 2. Setup

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npm run prisma:generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Verification & Testing

Run the comprehensive regression test suite (80 assertions covering pricing, cart sync, coupons, auth hardening, slug normalization, and decimal precision):

```bash
# Run regression test suite
npm test

# Type checking
npx tsc --noEmit

# Lint check
npm run lint
```

---

## 🗄️ Database Management & Safe Migrations

> **CRITICAL POLICY:** Never use `prisma db push --accept-data-loss` in production. Always use versioned migrations.

### Standard Migration Deployment

```bash
# Apply pending migrations
npm run prisma:deploy
```

### Financial Decimal Migration (Safe VPS Script)

To apply the Float → Decimal migration with automated pre-migration JSON backups, connection verification, and post-migration sum validation:

```bash
npm run migrate:decimal
```

### Database Utilities

```bash
# Backup database to JSON
npm run db:backup

# Fast import from JSON backup
npm run db:import

# Clear database (requires interactive confirmation)
node scripts/clear-db.js
```

---

## ⚙️ Environment Variables

Set the following variables in your deployment environment (`.env.production`):

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` / `POSTGRES_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (minimum 32 characters) |
| `NEXT_PUBLIC_SITE_URL` | Public base URL (e.g., `https://ice-center.ir`) |
| `MELIPAYAMAK_API_KEY` | Melipayamak SMS OTP API Key |
| `CRON_SECRET` | Secret token for securing scheduled cron endpoints |
| `ANALYTICS_SALT` | Hashing salt for anonymous visitor tracking |

### Optional Configuration

- `UPLOADS_DIR` (Custom upload directory path; defaults to `public/uploads`)
- `KV_REST_API_URL` (Upstash Redis REST URL)
- `KV_REST_API_TOKEN` (Upstash Redis REST Token)
- `KV_REST_API_READ_ONLY_TOKEN` (Upstash Redis Read-Only Token)

### Recommended (Public Store Info)

- `NEXT_PUBLIC_PHONE`
- `NEXT_PUBLIC_EMAIL`
- `NEXT_PUBLIC_ADDRESS`
- `NEXT_PUBLIC_INSTAGRAM`
- `NEXT_PUBLIC_TELEGRAM`

### Optional (Distributed Redis Caching)

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

---

## ⏰ Scheduled Jobs (Cron)

The repository configures the following endpoints (defined in `vercel.json`):

- `/api/cron/sync-offers` — Runs every 5 minutes (transitions offer statuses)
- `/api/cron/abandoned-carts` — Runs hourly (cleans up stale guest cart reservations)

All cron endpoints require authentication:

```text
Authorization: Bearer <CRON_SECRET>
```

---

## 📦 VPS Deployment

For packaging and standalone deployment to a VPS:

```powershell
# Create deployment package
npm run pack:vps
```

On the target VPS server:
```bash
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ice-center
```

---

## 📖 Architecture & Engineering History

For detailed documentation on the code review audit, bug resolutions, and architectural decisions, refer to:
- [`BUG_RESOLUTION_HISTORY_FINAL.md`](./BUG_RESOLUTION_HISTORY_FINAL.md) — Master bug resolution and engineering history report
- [`CODE_REVIEW.md`](./CODE_REVIEW.md) — Original comprehensive code audit and verification matrix
