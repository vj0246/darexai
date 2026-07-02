import { PrismaClient } from "@prisma/client";

// Singleton — avoid exhausting connections on hot reload.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  g.prisma ?? new PrismaClient({ log: ["warn", "error"] });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
