import { NextRequest, NextResponse } from "next/server";
import { processDealEvent } from "@/lib/deal-radar-service";

function telegramMessage(update: Record<string, unknown>) {
  return (update.channel_post ?? update.message ?? update.edited_channel_post ?? update.edited_message) as
    | Record<string, unknown>
    | undefined;
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (receivedSecret !== configuredSecret) {
    return NextResponse.json({ error: "invalid webhook secret" }, { status: 401 });
  }

  const update = (await request.json()) as Record<string, unknown>;
  const message = telegramMessage(update);
  if (!message) return NextResponse.json({ ok: true, ignored: "unsupported update" });

  const chat = (message.chat ?? {}) as Record<string, unknown>;
  const sender = (message.from ?? {}) as Record<string, unknown>;
  const text = String(message.text ?? message.caption ?? "").trim();
  if (!text) return NextResponse.json({ ok: true, ignored: "no text" });

  const username = typeof chat.username === "string" ? chat.username : undefined;
  const messageId = String(message.message_id ?? "");
  const sourceUrl = username && messageId ? `https://t.me/${username}/${messageId}` : undefined;
  const title = String(chat.title ?? username ?? chat.id ?? "Telegram");
  const postedAt = typeof message.date === "number" ? new Date(message.date * 1000) : new Date();

  const result = await processDealEvent({
    source: title,
    sourceType: "TELEGRAM",
    externalMessageId: messageId || undefined,
    sourceUrl,
    seller: String(sender.username ?? sender.first_name ?? "") || undefined,
    text,
    postedAt,
  });

  return NextResponse.json({ ok: true, result });
}
