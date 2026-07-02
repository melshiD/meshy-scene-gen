/**
 * Prisma client singleton.
 *
 * Next.js hot-reload (dev) would otherwise spawn a new PrismaClient per recompile and exhaust the
 * Postgres connection pool. Reuse one instance across reloads via globalThis. In production one
 * instance per container process.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
