import { describe, expect, it } from "vitest";
import { summarizePortfolio } from "./portfolio";

describe("summarizePortfolio", () => {
  it("never treats a missing real quote as zero in P/L", () => {
    expect(summarizePortfolio([{ quantity: 2, paid: 30, market: null }])).toMatchObject({
      invested: 60,
      currentValue: 0,
      profitLoss: null,
      comparablePositions: 0,
    });
  });

  it("uses only equivalent recorded cost and market positions for P/L", () => {
    expect(summarizePortfolio([
      { quantity: 2, paid: 30, market: 42 },
      { quantity: 1, paid: null, market: 100 },
    ])).toMatchObject({
      totalCards: 3,
      invested: 60,
      currentValue: 184,
      profitLoss: 24,
      roiPercent: 40,
      comparablePositions: 1,
    });
  });
});
