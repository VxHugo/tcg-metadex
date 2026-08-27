import { NextRequest, NextResponse } from "next/server";
import { getLigaPokemonQuote } from "@/lib/ligapokemon";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const number = request.nextUrl.searchParams.get("number")?.trim() ?? "";
  const setCode = request.nextUrl.searchParams.get("setCode")?.trim() ?? "";
  const total = request.nextUrl.searchParams.get("total")?.trim() ?? "";
  if (!name || !number || !setCode) return NextResponse.json({ error: "invalid_card_identity" }, { status: 400 });
  try {
    return NextResponse.json(await getLigaPokemonQuote({ name, number, setCode, total }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ligapokemon_unavailable" }, { status: 502 });
  }
}
