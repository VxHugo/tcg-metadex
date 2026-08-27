import { Prisma } from "@prisma/client";
import { getLocalUser, listCollection } from "@/lib/collection-data";
import { prisma } from "@/lib/prisma";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function storeDailyPortfolioSnapshot() {
  const { summary } = await listCollection();
  if (!summary.comparablePositions || summary.profitLoss === null) {
    return { status: "no_comparable_prices" as const, snapshot: null };
  }

  const user = await getLocalUser();
  const today = startOfToday();
  const existing = await prisma.portfolioSnapshot.findFirst({ where: { userId: user.id, observedAt: { gte: today } }, orderBy: { observedAt: "desc" } });
  if (existing) return { status: "already_recorded" as const, snapshot: existing };

  const snapshot = await prisma.portfolioSnapshot.create({ data: {
    userId: user.id,
    invested: new Prisma.Decimal(summary.invested),
    currentValue: new Prisma.Decimal(summary.currentValue),
    profitLoss: new Prisma.Decimal(summary.profitLoss),
    roiPercent: summary.roiPercent === null ? undefined : new Prisma.Decimal(summary.roiPercent),
  } });
  return { status: "created" as const, snapshot };
}
