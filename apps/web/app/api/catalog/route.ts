import { NextRequest, NextResponse } from "next/server";
import { searchCards } from "@/lib/tcgdex";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ cards: [] });
  }

  try {
    const cards = await searchCards(q, 24);
    return NextResponse.json({ cards });
  } catch (error) {
    return NextResponse.json(
      { cards: [], error: error instanceof Error ? error.message : "catalog_error" },
      { status: 502 },
    );
  }
}
