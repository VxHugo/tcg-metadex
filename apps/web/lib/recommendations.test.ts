import { describe, expect, it } from "vitest";
import { buildRecommendations, type RecommendationObservation } from "./recommendations";

function observation(id: string, source: string, price: number, observedAt: string, overrides: Partial<RecommendationObservation> = {}): RecommendationObservation {
  return {
    id,
    productId: "sv3-215",
    source,
    sourceUrl: `https://example.test/${id}`,
    seller: null,
    currency: "BRL",
    price,
    shipping: null,
    condition: "NM",
    language: "pt-BR",
    variant: "normal",
    gradeCompany: null,
    gradeValue: null,
    observedAt: new Date(observedAt),
    detectedAt: new Date(observedAt),
    matchConfidence: 0.98,
    sourceReliability: 0.9,
    product: { id: "sv3-215", name: "Charizard ex", imageUrl: null, localNumber: "215", type: "CARD" },
    ...overrides,
  };
}

describe("recommendations", () => {
  it("ranks an auditable offer only when it is below equivalent current references", () => {
    const result = buildRecommendations([
      observation("liga", "LIGA_POKEMON", 300, "2026-08-15T10:00:00.000Z"),
      observation("myp", "MYP_CARDS", 280, "2026-08-15T10:05:00.000Z"),
      observation("store", "LOJA_A", 290, "2026-08-15T10:10:00.000Z"),
      observation("deal", "OFERTA_AUTORIZADA", 190, "2026-08-15T10:15:00.000Z"),
      observation("jp", "LOJA_JP", 90, "2026-08-15T10:20:00.000Z", { language: "ja" }),
    ], new Date("2026-08-15T11:00:00.000Z"));

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0]).toMatchObject({ id: "deal", referencePrice: 290, savings: 100, discountPercent: 34.48, confidence: "medium" });
    expect(result.deals[0].referenceSources).toEqual(["LOJA_A", "MYP_CARDS", "LIGA_POKEMON"]);
  });

  it("reports an observed upward movement without calling it a prediction", () => {
    const result = buildRecommendations([
      observation("day-1", "LIGA_POKEMON", 100, "2026-08-01T10:00:00.000Z", { productId: "sv8-1", product: { id: "sv8-1", name: "Pikachu ex", imageUrl: null, localNumber: "001", type: "CARD" } }),
      observation("day-8", "MYP_CARDS", 115, "2026-08-08T10:00:00.000Z", { productId: "sv8-1", product: { id: "sv8-1", name: "Pikachu ex", imageUrl: null, localNumber: "001", type: "CARD" } }),
      observation("day-15", "LOJA_A", 130, "2026-08-15T10:00:00.000Z", { productId: "sv8-1", product: { id: "sv8-1", name: "Pikachu ex", imageUrl: null, localNumber: "001", type: "CARD" } }),
    ], new Date("2026-08-15T11:00:00.000Z"));

    expect(result.valueSignals).toHaveLength(1);
    expect(result.valueSignals[0]).toMatchObject({ productName: "Pikachu ex", baselinePrice: 100, currentPrice: 130, changePercent: 30, confidence: "medium" });
  });
});
