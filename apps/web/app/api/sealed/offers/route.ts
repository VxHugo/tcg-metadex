import { NextRequest, NextResponse } from "next/server";
import { getSealedOffers, isSealedCategoryId } from "@/lib/sealed-products";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? "pack";
  if (!isSealedCategoryId(category)) return NextResponse.json({ error: "invalid_sealed_category" }, { status: 400 });
  const result = await getSealedOffers(category);
  return NextResponse.json(result, { status: result.status === "source_unavailable" ? 503 : 200 });
}
