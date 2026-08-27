import { NextRequest, NextResponse } from "next/server";
import { getMypCardsQuote } from "@/lib/mypcards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const number = request.nextUrl.searchParams.get("number")?.trim() ?? "";
  const setName = request.nextUrl.searchParams.get("setName")?.trim() ?? "";
  const setId = request.nextUrl.searchParams.get("setId")?.trim() ?? "";
  if (!name || !number || !setName || name.length > 120 || number.length > 40 || setName.length > 180) {
    return NextResponse.json({ error: "invalid_card_identity" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getMypCardsQuote({ id: "quote", name, localId: number, set: { id: setId, name: setName } }));
  } catch (error) {
    const code = error instanceof Error ? error.message : "mypcards_unavailable";
    const status = code === "mypcards_not_configured" ? 424 : code === "mypcards_unauthorized" ? 502 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
