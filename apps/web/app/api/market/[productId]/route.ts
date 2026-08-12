import { NextRequest, NextResponse } from "next/server";
import { getMarketAggregate } from "@/lib/market-data";

const conditions = new Set(["NM", "LP", "MP", "HP", "DAMAGED"]);

export async function GET(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  const condition = request.nextUrl.searchParams.get("condition");
  try {
    const market = await getMarketAggregate({
      productId,
      condition: condition && conditions.has(condition) ? condition as "NM" | "LP" | "MP" | "HP" | "DAMAGED" : null,
      language: request.nextUrl.searchParams.get("language"),
      variant: request.nextUrl.searchParams.get("variant"),
      gradeCompany: request.nextUrl.searchParams.get("gradeCompany"),
      gradeValue: Number(request.nextUrl.searchParams.get("gradeValue")) || null,
    });
    return NextResponse.json({ market });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "market_storage_unavailable" }, { status: 503 });
  }
}
