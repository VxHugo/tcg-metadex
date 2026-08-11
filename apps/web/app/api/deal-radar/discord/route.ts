import { NextRequest, NextResponse } from "next/server";
import { processDealEvent } from "@/lib/deal-radar-service";

export async function POST(request: NextRequest) {
  const expected = process.env.DEAL_RADAR_INTERNAL_TOKEN;
  if (!expected) return NextResponse.json({ error: "DEAL_RADAR_INTERNAL_TOKEN is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    guildName?: string;
    channelName?: string;
    messageId?: string;
    messageUrl?: string;
    author?: string;
    content?: string;
    timestamp?: string;
  };

  if (!body.content?.trim()) return NextResponse.json({ ok: true, ignored: "no content" });

  const result = await processDealEvent({
    source: [body.guildName, body.channelName].filter(Boolean).join(" / ") || "Discord",
    sourceType: "DISCORD",
    externalMessageId: body.messageId,
    sourceUrl: body.messageUrl,
    seller: body.author,
    text: body.content,
    postedAt: body.timestamp ? new Date(body.timestamp) : new Date(),
  });

  return NextResponse.json({ ok: true, result });
}
