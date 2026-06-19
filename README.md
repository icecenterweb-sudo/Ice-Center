# Ice Center

Next.js 16 ecommerce/admin app with Prisma 7, PostgreSQL, Cloudinary uploads, Melipayamak OTP, optional Upstash Redis cache, analytics, and scheduled maintenance routes.

## Local Development

```bash
npm ci
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Required Production Environment

Use real secret values in the deployment platform. The local `.env.production` in this workspace contains sample placeholders only and `.env*` files are ignored by git.

Required:

- `POSTGRES_URL` or `DATABASE_URL`
- `JWT_SECRET` with at least 32 characters
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MELIPAYAMAK_API_KEY`
- `CRON_SECRET`
- `ANALYTICS_SALT`

Recommended public contact fields:

- `NEXT_PUBLIC_PHONE`
- `NEXT_PUBLIC_EMAIL`
- `NEXT_PUBLIC_ADDRESS`
- `NEXT_PUBLIC_INSTAGRAM`
- `NEXT_PUBLIC_TELEGRAM`

Optional cache fields:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## Database Deployment

Run migrations against production before or during release:

```bash
npm run prisma:deploy
```

Use `npm run seed` only for a fresh environment where sample/admin seed data is expected.

## Verification

```bash
npx eslint --quiet
npm run build
```

`npm run lint` may still print warnings for existing cleanup work, but `npx eslint --quiet` must pass with zero errors.

## Scheduled Jobs

`vercel.json` registers:

- `/api/cron/sync-offers` every 5 minutes
- `/api/cron/abandoned-carts` hourly

Both cron routes fail closed in production when `CRON_SECRET` is missing. External schedulers must send:

```text
Authorization: Bearer <CRON_SECRET>
```
