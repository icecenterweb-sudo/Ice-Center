import { PrismaClient } from "@prisma/client";
import { Pool, PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Global singleton pattern for both Pool and PrismaClient
 * Prevents connection leaks during development hot reloads
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Pool configuration tuned for Cloud Postgres / Prisma Accelerate proxies
const poolConfig: PoolConfig = {
  connectionString,
  max: 10,                          // Max connections in pool
  min: 0,                           // Set min to 0 so idle connections drain cleanly
  idleTimeoutMillis: 10000,         // Close idle connections after 10s before remote proxy drops them
  connectionTimeoutMillis: 10000,   // Connection timeout
  keepAlive: true,                  // Enable TCP keepalive
  keepAliveInitialDelayMillis: 10000,
  ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
};

// Reuse pool in development to prevent connection exhaustion
const pool = globalForPrisma.pool ?? new Pool(poolConfig);

// Handle pool errors gracefully (suppress routine idle socket drops from remote proxy)
pool.on('error', (err) => {
  if (err.message && (err.message.includes('Connection terminated unexpectedly') || err.message.includes('terminating connection'))) {
    // Routine idle connection termination by remote proxy — node-postgres handles reconnection automatically on next query
    return;
  }
  console.error('PostgreSQL pool error:', err);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

// Store in global to reuse in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;
