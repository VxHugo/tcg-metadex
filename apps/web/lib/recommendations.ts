import { calculateMarketAggregate, calculateTrend, effectivePrice, evaluateDeal, marketKey, type MarketListing } from "@tcg-intelligence/market-engine";

export type RecommendationObservation = MarketListing & {
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    localNumber: string | null;
    type: string;
  };
};

export type BuyRecommendation = {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  productType: string;
  localNumber: string | null;
  source: string;
  seller: string | null;
  sourceUrl: string;
  offerPrice: number;
  referencePrice: number;
  savings: number;
  discountPercent: number;
  dealScore: number;
  confidence: "medium" | "high";
  observedAt: string;
  referenceObservedAt: string;
  referenceSources: string[];
  referenceListings: number;
};

export type ValueSignal = {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  localNumber: string | null;
  currentPrice: number;
  baselinePrice: number;
  changePercent: number;
  changeAmount: number;
  score: number;
  confidence: "medium" | "high";
  observedAt: string;
  windowDays: number;
  sourceCount: number;
  observationCount: number;
};

export type RecommendationsResponse = {
  status: "ok" | "no_observations" | "storage_unavailable";
  deals: BuyRecommendation[];
  valueSignals: ValueSignal[];
  observedAt: string | null;
  message: string;
  coverage: { observations: number; products: number; sources: number };
};

export const emptyRecommendations: RecommendationsResponse = {
  status: "no_observations",
  deals: [],
  valueSignals: [],
  observedAt: null,
  message: "Ainda não existem observações auditáveis para comparar preços.",
  coverage: { observations: 0, products: 0, sources: 0 },
};

const precision = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? precision((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function ageHours(value: Date, now: Date) {
  return Math.max(0, (now.getTime() - value.getTime()) / (1000 * 60 * 60));
}

function confidenceForSignal(pointCount: number, sourceCount: number, latest: Date, now: Date): "medium" | "high" | null {
  const fresh = ageHours(latest, now) <= 72;
  if (pointCount >= 7 && sourceCount >= 3 && ageHours(latest, now) <= 24) return "high";
  if (pointCount >= 3 && sourceCount >= 2 && fresh) return "medium";
  return null;
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dailyPrices(observations: RecommendationObservation[]) {
  const perDay = new Map<string, RecommendationObservation[]>();
  for (const observation of observations) {
    const key = dayKey(observation.observedAt);
    const entries = perDay.get(key) ?? [];
    entries.push(observation);
    perDay.set(key, entries);
  }
  return [...perDay.entries()]
    .map(([date, entries]) => ({ observedAt: new Date(`${date}T12:00:00.000Z`), marketPrice: median(entries.map(effectivePrice)) }))
    .sort((left, right) => left.observedAt.getTime() - right.observedAt.getTime());
}

function latestBySource(observations: RecommendationObservation[]) {
  const bySource = new Map<string, RecommendationObservation>();
  for (const observation of [...observations].sort((left, right) => right.observedAt.getTime() - left.observedAt.getTime())) {
    if (!bySource.has(observation.source)) bySource.set(observation.source, observation);
  }
  return [...bySource.values()];
}

export function buildRecommendations(observations: RecommendationObservation[], now = new Date()): RecommendationsResponse {
  const brlObservations = observations.filter((observation) => observation.currency === "BRL" && observation.price >= 0);
  if (!brlObservations.length) return emptyRecommendations;

  const grouped = new Map<string, RecommendationObservation[]>();
  for (const observation of brlObservations) {
    const key = marketKey(observation);
    const entries = grouped.get(key) ?? [];
    entries.push(observation);
    grouped.set(key, entries);
  }

  const deals: BuyRecommendation[] = [];
  const valueSignals: ValueSignal[] = [];

  for (const [identityKey, group] of grouped) {
    const currentBySource = latestBySource(group);
    for (const candidate of currentBySource) {
      if (!candidate.sourceUrl || ageHours(candidate.observedAt, now) > 72) continue;
      const referenceObservations = currentBySource.filter((observation) => observation.id !== candidate.id && observation.source !== candidate.source);
      const reference = calculateMarketAggregate(candidate, referenceObservations, now);
      const deal = evaluateDeal(candidate, reference);
      if (!deal || reference.marketPrice === null || reference.observedAt === null || reference.listingCount < 3 || deal.discountPercent < 12 || deal.confidence === "low") continue;
      deals.push({
        id: candidate.id,
        productId: candidate.productId,
        productName: candidate.product.name,
        imageUrl: candidate.product.imageUrl,
        productType: candidate.product.type,
        localNumber: candidate.product.localNumber,
        source: candidate.source,
        seller: candidate.seller,
        sourceUrl: candidate.sourceUrl,
        offerPrice: effectivePrice(candidate),
        referencePrice: reference.marketPrice,
        savings: deal.discountAbsolute,
        discountPercent: deal.discountPercent,
        dealScore: deal.dealScore,
        confidence: deal.confidence,
        observedAt: candidate.observedAt.toISOString(),
        referenceObservedAt: reference.observedAt.toISOString(),
        referenceSources: [...new Set(referenceObservations.map((observation) => observation.source))],
        referenceListings: reference.listingCount,
      });
    }

    const product = group[0].product;
    if (product.type !== "CARD") continue;
    const latest = new Date(Math.max(...group.map((observation) => observation.observedAt.getTime())));
    const window = group.filter((observation) => ageHours(observation.observedAt, now) <= 30 * 24);
    const points = dailyPrices(window);
    const sources = new Set(window.map((observation) => observation.source));
    const trend = calculateTrend(points, 30, now);
    const confidence = confidenceForSignal(points.length, sources.size, latest, now);
    if (!confidence || trend.baselinePrice === null || trend.currentPrice === null || trend.changePercent === null || trend.changeAmount === null || trend.changePercent <= 0) continue;
    const score = Math.round(Math.min(100, (Math.min(trend.changePercent, 35) / 35) * 55 + Math.min(points.length / 7, 1) * 25 + Math.min(sources.size / 3, 1) * 20));
    valueSignals.push({
      id: `${identityKey}:momentum`,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      localNumber: product.localNumber,
      currentPrice: trend.currentPrice,
      baselinePrice: trend.baselinePrice,
      changePercent: trend.changePercent,
      changeAmount: trend.changeAmount,
      score,
      confidence,
      observedAt: latest.toISOString(),
      windowDays: 30,
      sourceCount: sources.size,
      observationCount: window.length,
    });
  }

  const observedAt = new Date(Math.max(...brlObservations.map((observation) => observation.observedAt.getTime()))).toISOString();
  return {
    status: "ok",
    deals: deals.sort((left, right) => right.dealScore - left.dealScore || right.discountPercent - left.discountPercent).slice(0, 12),
    valueSignals: valueSignals.sort((left, right) => right.score - left.score || right.changePercent - left.changePercent).slice(0, 12),
    observedAt,
    message: "Ranking calculado apenas com observações equivalentes e auditáveis. Cada oferta mantém a fonte e a hora da consulta.",
    coverage: { observations: brlObservations.length, products: new Set(brlObservations.map((observation) => observation.productId)).size, sources: new Set(brlObservations.map((observation) => observation.source)).size },
  };
}
