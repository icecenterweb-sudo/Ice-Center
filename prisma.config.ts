// Prisma config for Vercel Postgres
// Uses POSTGRES_URL (Vercel) with fallback to DATABASE_URL
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Try to load from .env.local first (for Vercel Postgres)
import { config } from 'dotenv';
config({ path: '.env.local' });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.POSTGRES_URL || env("DATABASE_URL"),
  },
});
