import { NextRequest, NextResponse } from "next/server";
import { parseMarketObservation, storeObservation } from "@/lib/market-data";

function authorized(request: NextRequest) {
  const token = process.env.MARKET_INGESTION_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "market_ingestion_unauthorized" }, { status: 401 });
  const parsed = parseMarketObservation(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "invalid_market_observation" }, { status: 400 });
  try {
    return NextResponse.json(await storeObservation(parsed), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "market_storage_unavailable" }, { status: 503 });
  }
}
