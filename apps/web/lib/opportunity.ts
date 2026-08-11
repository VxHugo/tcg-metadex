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

export type OpportunityScoreResult = {
  score: number;
  factors: {
    discount: number;
    price: number;
    history: number;
    trend: number;
    liquidity: number;
    availability: number;
    sourceConfidence: number;
    freshness: number;
  };
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function discountPercent(offerPrice: number, marketReference: number) {
  if (!marketReference || marketReference <= 0) return 0;
  return ((marketReference - offerPrice) / marketReference) * 100;
}

export function opportunityScore(input: OpportunityInputs): OpportunityScoreResult {
  const discount = discountPercent(input.offerPrice, input.marketReference);
  const priceScore = clamp((discount / 35) * 100);
  const history = clamp(input.historyStrength ?? 65);
  const trend = clamp(input.trendStrength ?? 60);
  const liquidity = clamp(input.liquidity ?? 60);
  const availability = clamp(input.availability ?? 60);
  const sourceConfidence = clamp(input.sourceConfidence ?? 75);
  const freshness = clamp(100 - (input.shippingPenalty ?? 15));

  const weighted =
    priceScore * 0.35 +
    history * 0.2 +
    trend * 0.15 +
    liquidity * 0.1 +
    availability * 0.1 +
    sourceConfidence * 0.05 +
    freshness * 0.05;

  return {
    score: Math.round(clamp(weighted)),
    factors: { discount, price: priceScore, history, trend, liquidity, availability, sourceConfidence, freshness },
  };
}
