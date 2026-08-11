type DealNotification = {
  title: string;
  source: string;
  sourceUrl?: string;
  price: number;
  referencePrice?: number;
  discountPercent?: number;
  score: number;
};

export function formatTelegramDealAlert(input: DealNotification) {
  const discount = input.discountPercent !== undefined ? `\n📉 ${input.discountPercent.toFixed(1)}% abaixo da referência` : "";
  const reference = input.referencePrice ? `\nReferência: R$ ${input.referencePrice.toFixed(2)}` : "";
  const link = input.sourceUrl ? `\n\n🔗 ${input.sourceUrl}` : "";
  return [
    "🚨 METADEX DEAL",
    "",
    input.title,
    `💰 R$ ${input.price.toFixed(2)}`,
    reference,
    discount,
    `\nDeal Score: ${input.score}/100`,
    `Fonte: ${input.source}`,
    link,
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

export async function notifyTelegram(input: DealNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.DEAL_ALERT_TELEGRAM_CHAT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!token || !chatIds.length) return { sent: 0, skipped: true };

  const text = formatTelegramDealAlert(input);
  let sent = 0;
  for (const chatId of chatIds) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
    });
    if (response.ok) sent += 1;
  }
  return { sent, skipped: false };
}

export async function notifyDiscord(input: DealNotification) {
  const webhookUrl = process.env.DEAL_ALERT_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, skipped: true };
  const content = formatTelegramDealAlert(input).replace(/🚨 METADEX DEAL/, "🚨 **METADEX DEAL**");
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return { sent: response.ok, skipped: false };
}

export async function notifyDeal(input: DealNotification) {
  if (input.score < Number(process.env.DEAL_ALERT_MIN_SCORE ?? 70)) {
    return { skipped: true, reason: "below score threshold" };
  }
  const [telegram, discord] = await Promise.allSettled([notifyTelegram(input), notifyDiscord(input)]);
  return { skipped: false, telegram, discord };
}
