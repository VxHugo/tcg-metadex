import { describe, expect, it } from "vitest";
import { discountPercent, opportunityScore } from "./opportunity";

describe("opportunity scoring", () => {
  it("exposes the auditable factors behind a strong offer", () => {
    const result = opportunityScore({
      offerPrice: 70,
      marketReference: 100,
      historyStrength: 80,
      trendStrength: 75,
      liquidity: 70,
      availability: 65,
      sourceConfidence: 90,
      shippingPenalty: 5,
    });

    expect(result.score).toBe(80);
    expect(result.factors.discount).toBe(30);
    expect(result.factors.price).toBeCloseTo(85.714);
    expect(result.factors.freshness).toBe(95);
  });

  it("does not invent a discount without a valid reference", () => {
    expect(discountPercent(50, 0)).toBe(0);
  });
});
