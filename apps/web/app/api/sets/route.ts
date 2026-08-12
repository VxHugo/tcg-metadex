import { NextRequest, NextResponse } from "next/server";
import { searchSets } from "@/lib/tcgdex";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ sets: await searchSets(query, 24) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "tcgdex_set_search_failed" }, { status: 502 });
  }
}
