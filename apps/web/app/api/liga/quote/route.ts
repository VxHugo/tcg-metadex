import { NextRequest, NextResponse } from "next/server";
import { getLigaPokemonQuote } from "@/lib/ligapokemon";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name || name.length > 120) return NextResponse.json({ error: "invalid_card_name" }, { status: 400 });
  try {
    return NextResponse.json(await getLigaPokemonQuote(name));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ligapokemon_unavailable" }, { status: 502 });
  }
}
