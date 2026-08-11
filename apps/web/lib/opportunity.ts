export type OpportunityInputs = {
  offerPrice: number;
  marketReference: number;
  historyStrength?: number;
  trendStrength?: number;
  liquidity?: number;
  availability?: number;
  sourceConfidence?: number;
  shippingPenalty?: number;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function discountPercent(offerPrice: number, marketReference: number) {
  if (!marketReference || marketReference <= 0) return 0;
  return ((marketReference - offerPrice) / marketReference) * 100;
}

export function opportunityScore(input: OpportunityInputs) {
  const discount = discountPercent(input.offerPrice, input.marketReference);
  const priceScore = clamp((discount / 35) * 100);

  const weighted =
    priceScore * 0.35 +
    clamp(input.historyStrength ?? 65) * 0.2 +
    clamp(input.trendStrength ?? 60) * 0.15 +
    clamp(input.liquidity ?? 60) * 0.1 +
    clamp(input.availability ?? 60) * 0.1 +
    clamp(input.sourceConfidence ?? 75) * 0.05 +
    clamp(100 - (input.shippingPenalty ?? 15)) * 0.05;

  return Math.round(clamp(weighted));
}
