import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations-data";
import { emptyRecommendations } from "@/lib/recommendations";

export async function GET() {
  try {
    return NextResponse.json(await getRecommendations());
  } catch {
    return NextResponse.json({
      ...emptyRecommendations,
      status: "storage_unavailable",
      message: "O banco de observações não está disponível agora. Nenhuma recomendação foi inventada.",
      error: "market_storage_unavailable",
    }, { status: 503 });
  }
}
