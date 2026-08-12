export type MarketCondition = "NM" | "LP" | "MP" | "HP" | "DAMAGED";

export interface MarketIdentity {
  productId: string;
  condition: MarketCondition | null;
  language: string | null;
  variant: string | null;
  gradeCompany: string | null;
  gradeValue: number | null;
}

export interface MarketListing extends MarketIdentity {
  id: string;
  source: string;
  sourceUrl: string;
  seller: string | null;
  currency: "BRL";
  price: number;
  shipping: number | null;
  observedAt: Date;
  detectedAt: Date;
  matchConfidence: number;
  sourceReliability: number | null;
}

export interface MarketSource {
  id: string;
  label: string;
  searchProduct(query: string): Promise<MarketListing[]>;
  getListings(identity: MarketIdentity): Promise<MarketListing[]>;
  getPrice(identity: MarketIdentity): Promise<MarketListing[]>;
}

export interface MarketAggregate extends MarketIdentity {
  status: "ok" | "no_comparable_observations";
  marketPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  medianPrice: number | null;
  averagePrice: number | null;
  listingCount: number;
  observedAt: Date | null;
  confidence: "low" | "medium" | "high" | null;
  sourceCount: number;
}

export interface MarketTrend {
  windowDays: number;
  baselinePrice: number | null;
  currentPrice: number | null;
  changeAmount: number | null;
  changePercent: number | null;
}

export interface DealEvaluation {
  discountAbsolute: number;
  discountPercent: number;
  dealScore: number;
  confidence: "low" | "medium" | "high";
  eligibleForAlert: boolean;
}

export interface PortfolioPosition {
  identity: MarketIdentity;
  quantity: number;
  purchasePrice: number | null;
  marketPrice: number | null;
}

export interface PortfolioValuation {
  invested: number;
  currentValue: number;
  profitLoss: number;
  roiPercent: number | null;
  valuedPositions: number;
  unvaluedPositions: number;
}

const precision = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function stableIdentityPart(value: string | number | null) {
  return value === null ? "unknown" : String(value).trim().toLowerCase() || "unknown";
}

export function marketKey(identity: MarketIdentity) {
  return [identity.productId, stableIdentityPart(identity.condition), stableIdentityPart(identity.language), stableIdentityPart(identity.variant), stableIdentityPart(identity.gradeCompany), stableIdentityPart(identity.gradeValue)].join("|");
}

export function isComparable(listing: MarketIdentity, identity: MarketIdentity) {
  return marketKey(listing) === marketKey(identity);
}

export function effectivePrice(listing: Pick<MarketListing, "price" | "shipping">) {
  return precision(listing.price + (listing.shipping ?? 0));
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? precision((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function confidence(listingCount: number, ageHours: number): MarketAggregate["confidence"] {
  if (listingCount >= 6 && ageHours <= 24) return "high";
  if (listingCount >= 3 && ageHours <= 72) return "medium";
  return "low";
}

export function calculateMarketAggregate(identity: MarketIdentity, observations: MarketListing[], now = new Date()): MarketAggregate {
  const comparable = observations.filter((listing) => isComparable(listing, identity));
  if (!comparable.length) {
    return { ...identity, status: "no_comparable_observations", marketPrice: null, lowestPrice: null, highestPrice: null, medianPrice: null, averagePrice: null, listingCount: 0, observedAt: null, confidence: null, sourceCount: 0 };
  }
  const prices = comparable.map(effectivePrice);
  const observedAt = new Date(Math.max(...comparable.map((listing) => listing.observedAt.getTime())));
  const medianPrice = median(prices);
  const averagePrice = precision(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const ageHours = Math.max(0, (now.getTime() - observedAt.getTime()) / (1000 * 60 * 60));
  return { ...identity, status: "ok", marketPrice: medianPrice, lowestPrice: Math.min(...prices), highestPrice: Math.max(...prices), medianPrice, averagePrice, listingCount: comparable.length, observedAt, confidence: confidence(comparable.length, ageHours), sourceCount: new Set(comparable.map((listing) => listing.source)).size };
}

export function calculateTrend(aggregates: Array<{ observedAt: Date; marketPrice: number }>, windowDays: number, now = new Date()): MarketTrend {
  const threshold = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const eligible = aggregates.filter((aggregate) => aggregate.observedAt.getTime() >= threshold).sort((left, right) => left.observedAt.getTime() - right.observedAt.getTime());
  if (eligible.length < 2) return { windowDays, baselinePrice: null, currentPrice: null, changeAmount: null, changePercent: null };
  const baselinePrice = eligible[0].marketPrice;
  const currentPrice = eligible[eligible.length - 1].marketPrice;
  const changeAmount = precision(currentPrice - baselinePrice);
  return { windowDays, baselinePrice, currentPrice, changeAmount, changePercent: precision((changeAmount / baselinePrice) * 100) };
}

export function evaluateDeal(listing: MarketListing, baseline: MarketAggregate): DealEvaluation | null {
  if (baseline.status !== "ok" || baseline.marketPrice === null || !isComparable(listing, baseline)) return null;
  const offeredPrice = effectivePrice(listing);
  const discountAbsolute = precision(baseline.marketPrice - offeredPrice);
  const discountPercent = precision((discountAbsolute / baseline.marketPrice) * 100);
  const signals = [{ value: Math.min(100, Math.max(0, (discountPercent / 35) * 100)), weight: 0.5 }, { value: Math.min(100, Math.max(0, listing.matchConfidence * 100)), weight: 0.3 }, ...(listing.sourceReliability === null ? [] : [{ value: Math.min(100, Math.max(0, listing.sourceReliability * 100)), weight: 0.2 }])];
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const dealScore = Math.round(signals.reduce((sum, signal) => sum + signal.value * signal.weight, 0) / totalWeight);
  const dealConfidence = baseline.confidence === "high" && listing.matchConfidence >= 0.9 ? "high" : baseline.confidence === "low" || listing.matchConfidence < 0.7 ? "low" : "medium";
  return { discountAbsolute, discountPercent, dealScore, confidence: dealConfidence, eligibleForAlert: discountPercent >= 20 && dealConfidence !== "low" };
}

export function valuePortfolio(positions: PortfolioPosition[]): PortfolioValuation {
  let invested = 0;
  let currentValue = 0;
  let valuedPositions = 0;
  let unvaluedPositions = 0;
  for (const position of positions) {
    if (position.purchasePrice !== null) invested += position.purchasePrice * position.quantity;
    if (position.marketPrice === null) { unvaluedPositions += 1; continue; }
    currentValue += position.marketPrice * position.quantity;
    valuedPositions += 1;
  }
  const profitLoss = precision(currentValue - invested);
  return { invested: precision(invested), currentValue: precision(currentValue), profitLoss, roiPercent: invested > 0 ? precision((profitLoss / invested) * 100) : null, valuedPositions, unvaluedPositions };
}

export class ManualProvider implements MarketSource {
  readonly id = "manual";
  readonly label = "Observação manual auditável";
  constructor(private readonly observations: MarketListing[] = []) {}
  async searchProduct(query: string) { return this.observations.filter((listing) => listing.productId.toLowerCase().includes(query.trim().toLowerCase())); }
  async getListings(identity: MarketIdentity) { return this.observations.filter((listing) => isComparable(listing, identity)); }
  async getPrice(identity: MarketIdentity) { return this.getListings(identity); }
}
