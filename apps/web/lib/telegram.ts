export type TelegramCredentials = {
  botToken?: string;
  chatId?: string;
};

export type TelegramDelivery =
  | { status: "sent" }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export function telegramCredentials(): TelegramCredentials {
  return { botToken: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID };
}

export async function sendTelegramMessage(text: string, credentials = telegramCredentials()): Promise<TelegramDelivery> {
  if (!credentials.botToken || !credentials.chatId) return { status: "not_configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${credentials.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: credentials.chatId, text, disable_web_page_preview: true }),
    });
    if (!response.ok) return { status: "failed", error: `telegram_${response.status}` };
    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "telegram_unavailable" };
  }
}
