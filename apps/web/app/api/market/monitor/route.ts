import { NextRequest, NextResponse } from "next/server";
import { deliverNewDealAlerts, monitorStatus } from "@/lib/market-monitor";
import { getRecommendations } from "@/lib/recommendations-data";
import { storeDailyPortfolioSnapshot } from "@/lib/portfolio-snapshots";

function authorized(request: NextRequest) {
  const token = process.env.MARKET_JOB_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET() {
  return NextResponse.json(monitorStatus());
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "market_monitor_unauthorized" }, { status: 401 });
  try {
    const recommendations = await getRecommendations();
    const [alerts, portfolio] = await Promise.all([
      deliverNewDealAlerts(recommendations.deals),
      storeDailyPortfolioSnapshot(),
    ]);
    return NextResponse.json({ status: "ok", monitor: monitorStatus(), alerts, portfolio, coverage: recommendations.coverage });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "market_monitor_unavailable" }, { status: 503 });
  }
}
