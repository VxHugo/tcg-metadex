import { describe, expect, it } from "vitest";
import { cardPriceQuotes } from "./card-prices";

describe("cardPriceQuotes", () => {
  it("keeps the provider currency and ignores invalid price fields", () => {
    const quotes = cardPriceQuotes({ id: "sv1-1", name: "Pikachu", localId: "001", pricing: { cardmarket: { unit: "EUR", trend: 12.5, avg: 10, low: -1 } } });
    expect(quotes).toEqual([
      { label: "Tendência", value: 12.5, currency: "EUR", source: "Cardmarket via TCGdex" },
      { label: "Média", value: 10, currency: "EUR", source: "Cardmarket via TCGdex" },
    ]);
  });
});
