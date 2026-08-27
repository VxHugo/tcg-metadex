import type { BuyRecommendation } from "@/lib/recommendations";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, telegramCredentials } from "@/lib/telegram";
import { dealDeduplicationKey, formatDealAlert } from "@/lib/market-monitor-format";

export { dealDeduplicationKey, formatDealAlert } from "@/lib/market-monitor-format";

export type MonitorStatus = {
  marketIngestion: "configured" | "development_only" | "missing";
  marketJob: "configured" | "development_only" | "missing";
  mercadoLivre: "configured" | "missing";
  telegram: "configured" | "missing";
  ligaReference: "manual_or_partner_feed_required";
};

export function monitorStatus(): MonitorStatus {
  const telegram = telegramCredentials();
  const development = process.env.NODE_ENV !== "production";
  return {
    marketIngestion: process.env.MARKET_INGESTION_TOKEN ? "configured" : development ? "development_only" : "missing",
    marketJob: process.env.MARKET_JOB_TOKEN ? "configured" : development ? "development_only" : "missing",
    mercadoLivre: process.env.MELI_ACCESS_TOKEN ? "configured" : "missing",
    telegram: telegram.botToken && telegram.chatId ? "configured" : "missing",
    ligaReference: "manual_or_partner_feed_required",
  };
}

export async function deliverNewDealAlerts(deals: BuyRecommendation[]) {
  const credentials = telegramCredentials();
  if (!credentials.botToken || !credentials.chatId) {
    return { status: "telegram_not_configured" as const, candidates: deals.length, sent: 0, skipped: 0, failed: 0 };
  }

  const channel = `telegram:${credentials.chatId}`;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const deal of deals) {
    const deduplicationKey = dealDeduplicationKey(deal);
    const prior = await prisma.notificationDelivery.findUnique({ where: { channel_deduplicationKey: { channel, deduplicationKey } } });
    if (prior) {
      skipped += 1;
      continue;
    }
    const result = await sendTelegramMessage(formatDealAlert(deal), credentials);
    if (result.status === "sent") {
      await prisma.notificationDelivery.create({ data: { channel, deduplicationKey, payload: { dealId: deal.id, source: deal.source, sourceUrl: deal.sourceUrl, offerPrice: deal.offerPrice } } });
      sent += 1;
    } else {
      failed += 1;
    }
  }
  return { status: "ok" as const, candidates: deals.length, sent, skipped, failed };
}
