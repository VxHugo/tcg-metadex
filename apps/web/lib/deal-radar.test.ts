import { describe, expect, it } from "vitest";
import { dealFingerprint, evaluateDeal, parseDealMessage } from "./deal-radar";

describe("deal radar", () => {
  it("parses a common Brazilian promotion message", () => {
    const parsed = parseDealMessage({
      source: "Promo Pokemon BR",
      sourceType: "TELEGRAM",
      text: "PROMO 🔥\nCharizard ex 215/197\nNM\nR$ 190,00\nchama pv",
    });

    expect(parsed.name).toContain("Charizard ex");
    expect(parsed.collectorNumber).toBe("215/197");
    expect(parsed.condition).toBe("NM");
    expect(parsed.price).toBe(190);
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("calculates discount and a strong score", () => {
    const parsed = parseDealMessage({ source: "Telegram", sourceType: "TELEGRAM", text: "Pikachu 160/159 NM R$ 100,00" });
    const result = evaluateDeal(parsed, {
      source: "Liga Pokémon",
      lowest: 150,
      median: 165,
      listingCount: 8,
      observedAt: new Date(),
    }, { matchConfidence: 0.95, sourceReliability: 0.8 });

    expect(result.discountAbsolute).toBe(50);
    expect(result.discountPercent).toBeCloseTo(33.33, 2);
    expect(result.score).toBeGreaterThan(70);
  });

  it("creates stable fingerprints", () => {
    const a = parseDealMessage({ source: "A", sourceType: "TELEGRAM", text: "Gengar VMAX 271/264 R$ 1.500,00" });
    const b = parseDealMessage({ source: "B", sourceType: "DISCORD", text: "Gengar VMAX 271/264 R$ 1.500,00" });
    expect(dealFingerprint(a)).toBe(dealFingerprint(b));
  });
});
