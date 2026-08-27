import { describe, expect, it } from "vitest";
import { cardPriceQuotes } from "./card-prices";

describe("cardPriceQuotes", () => {
  it("keeps the provider currency and ignores invalid price fields", () => {
    const quotes = cardPriceQuotes({ id: "sv1-1", name: "Pikachu", localId: "001", pricing: { cardmarket: { unit: "EUR", trend: 12.5, avg: 10, low: -1 } } });
    expect(quotes).toEqual([
      { label: "Tendência", value: 12.5, currency: "EUR", source: "Cardmarket via Pokémon TCG API" },
      { label: "Média", value: 10, currency: "EUR", source: "Cardmarket via Pokémon TCG API" },
    ]);
  });

  it("reads TCGplayer market prices when the card comes from the Pokemon TCG API", () => {
    const quotes = cardPriceQuotes({ id: "pokemon-tcg:base1-58", name: "Pikachu", localId: "58", pricing: { tcgplayer: { prices: { normal: { market: 3.25 }, holofoil: { low: 5 } } } } });
    expect(quotes).toEqual([
      { label: "Mercado · Normal", value: 3.25, currency: "USD", source: "TCGplayer via Pokémon TCG API" },
      { label: "Mercado · Holo", value: 5, currency: "USD", source: "TCGplayer via Pokémon TCG API" },
    ]);
  });
});
