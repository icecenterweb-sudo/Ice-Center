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

// Pool configuration with connection limits
const poolConfig: PoolConfig = {
  connectionString,
  max: 20,                    // Maximum connections in pool
  min: 2,                     // Minimum connections to keep
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
};

// Reuse pool in development to prevent connection exhaustion
const pool = globalForPrisma.pool ?? new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
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
