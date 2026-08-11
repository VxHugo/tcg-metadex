import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const DEFAULT_DEV_USER_EMAIL = "collector@tcg-intelligence.local";

export async function getDevUser() {
  const email = process.env.DEV_USER_EMAIL ?? DEFAULT_DEV_USER_EMAIL;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Colecionador" },
  });
}
