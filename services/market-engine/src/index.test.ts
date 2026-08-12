import { describe, expect, it } from "vitest";
import { calculateMarketAggregate, calculateTrend, evaluateDeal, valuePortfolio, type MarketIdentity, type MarketListing } from "./index";

const identity: MarketIdentity = { productId: "sv3-215", condition: "NM", language: "pt-BR", variant: "normal", gradeCompany: null, gradeValue: null };
function listing(id: string, source: string, price: number, observedAt: string): MarketListing { return { id, ...identity, source, sourceUrl: `https://example.test/${id}`, seller: null, currency: "BRL", price, shipping: null, observedAt: new Date(observedAt), detectedAt: new Date(observedAt), matchConfidence: 0.98, sourceReliability: 0.9 }; }

describe("market engine", () => {
  it("ingests observations, calculates a market baseline, then finds a deal and alert", () => {
    const baseline = calculateMarketAggregate(identity, [listing("liga-1", "LIGA_POKEMON", 300, "2026-08-12T09:00:00.000Z"), listing("myp-1", "MYP_CARDS", 280, "2026-08-12T09:02:00.000Z"), listing("store-1", "STORE", 290, "2026-08-12T09:04:00.000Z")], new Date("2026-08-12T10:00:00.000Z"));
    const deal = evaluateDeal(listing("deal-1", "TELEGRAM_AUTHORIZED", 189, "2026-08-12T10:01:00.000Z"), baseline);
    expect(baseline.marketPrice).toBe(290);
    expect(baseline.listingCount).toBe(3);
    expect(deal).toMatchObject({ discountAbsolute: 101, discountPercent: 34.83, eligibleForAlert: true });
  });
  it("never aggregates another condition, language, variant, or grade with the target market", () => {
    const incompatible = { ...listing("jp", "MYP_CARDS", 80, "2026-08-12T09:00:00.000Z"), language: "ja", variant: "reverse" };
    const aggregate = calculateMarketAggregate(identity, [listing("nm", "LIGA_POKEMON", 300, "2026-08-12T09:00:00.000Z"), incompatible]);
    expect(aggregate.listingCount).toBe(1);
    expect(aggregate.marketPrice).toBe(300);
  });
  it("calculates trends and portfolio valuation from stored comparable market prices", () => {
    const trend = calculateTrend([{ observedAt: new Date("2026-08-05T12:00:00.000Z"), marketPrice: 500 }, { observedAt: new Date("2026-08-12T12:00:00.000Z"), marketPrice: 650 }], 7, new Date("2026-08-12T12:00:00.000Z"));
    const portfolio = valuePortfolio([{ identity, quantity: 2, purchasePrice: 180, marketPrice: 285 }, { identity, quantity: 1, purchasePrice: 100, marketPrice: null }]);
    expect(trend).toMatchObject({ changeAmount: 150, changePercent: 30 });
    expect(portfolio).toMatchObject({ invested: 460, currentValue: 570, profitLoss: 110, roiPercent: 23.91, valuedPositions: 1, unvaluedPositions: 1 });
  });
});
