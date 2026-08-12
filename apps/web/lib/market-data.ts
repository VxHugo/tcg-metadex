import { Prisma, type CardCondition } from "@prisma/client";
import { calculateMarketAggregate, evaluateDeal, type MarketAggregate, type MarketCondition, type MarketIdentity, type MarketListing } from "@tcg-intelligence/market-engine";
import { prisma } from "@/lib/prisma";

const conditions = new Set<MarketCondition>(["NM", "LP", "MP", "HP", "DAMAGED"]);

type ObjectValue = Record<string, unknown>;

export interface MarketObservationInput {
  product: { id: string; name: string; imageUrl?: string | null; localNumber?: string | null };
  source: string;
  sourceUrl: string;
  seller?: string | null;
  price: number;
  shipping?: number | null;
  condition?: MarketCondition | null;
  language?: string | null;
  variant?: string | null;
  gradeCompany?: string | null;
  gradeValue?: number | null;
  observedAt?: string;
  matchConfidence?: number;
  sourceReliability?: number | null;
}

function asObject(value: unknown): ObjectValue | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as ObjectValue : null;
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalCondition(value: unknown): MarketCondition | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && conditions.has(value as MarketCondition) ? value as MarketCondition : null;
}

function optionalPercent(value: unknown, fallback: number | null) {
  if (value === null || value === undefined) return fallback;
  const number = asFiniteNumber(value);
  return number !== null && number >= 0 && number <= 1 ? number : null;
}

export function parseMarketObservation(value: unknown): MarketObservationInput | null {
  const input = asObject(value);
  const product = asObject(input?.product);
  const productId = asText(product?.id);
  const name = asText(product?.name);
  const source = asText(input?.source);
  const sourceUrl = asText(input?.sourceUrl);
  const price = asFiniteNumber(input?.price);
  const shipping = input?.shipping === null || input?.shipping === undefined ? null : asFiniteNumber(input.shipping);
  const condition = optionalCondition(input?.condition);
  if (!input || !product || !productId || !name || !source || !sourceUrl || price === null || price < 0 || (input.condition && !condition) || (shipping !== null && shipping < 0)) return null;
  const observedAt = input.observedAt === undefined ? undefined : asText(input.observedAt);
  const gradeValue = input.gradeValue === undefined || input.gradeValue === null ? null : asFiniteNumber(input.gradeValue);
  if (observedAt && Number.isNaN(new Date(observedAt).getTime())) return null;
  if (gradeValue !== null && gradeValue < 0) return null;
  return {
    product: { id: productId, name, imageUrl: asText(product.imageUrl), localNumber: asText(product.localNumber) },
    source,
    sourceUrl,
    seller: asText(input.seller),
    price,
    shipping,
    condition,
    language: asText(input.language),
    variant: asText(input.variant),
    gradeCompany: asText(input.gradeCompany),
    gradeValue,
    observedAt: observedAt ?? undefined,
    matchConfidence: optionalPercent(input.matchConfidence, 1) ?? undefined,
    sourceReliability: optionalPercent(input.sourceReliability, null),
  };
}

function identityFromInput(input: MarketObservationInput): MarketIdentity {
  return { productId: input.product.id, condition: input.condition ?? null, language: input.language ?? null, variant: input.variant ?? null, gradeCompany: input.gradeCompany ?? null, gradeValue: input.gradeValue ?? null };
}

function listingFromSnapshot(snapshot: { id: string; productId: string; source: string; sourceUrl: string | null; seller: string | null; currency: string; price: Prisma.Decimal; shipping: Prisma.Decimal | null; condition: CardCondition | null; language: string | null; variant: string | null; gradeCompany: string | null; gradeValue: Prisma.Decimal | null; observedAt: Date; matchConfidence: number; sourceReliability: number | null }): MarketListing {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    source: snapshot.source,
    sourceUrl: snapshot.sourceUrl ?? "",
    seller: snapshot.seller,
    currency: snapshot.currency as "BRL",
    price: Number(snapshot.price),
    shipping: snapshot.shipping === null ? null : Number(snapshot.shipping),
    condition: snapshot.condition as MarketCondition | null,
    language: snapshot.language,
    variant: snapshot.variant,
    gradeCompany: snapshot.gradeCompany,
    gradeValue: snapshot.gradeValue === null ? null : Number(snapshot.gradeValue),
    observedAt: snapshot.observedAt,
    detectedAt: snapshot.observedAt,
    matchConfidence: snapshot.matchConfidence,
    sourceReliability: snapshot.sourceReliability,
  };
}

export async function getMarketAggregate(identity: MarketIdentity): Promise<MarketAggregate> {
  const snapshots = await prisma.priceSnapshot.findMany({ where: { productId: identity.productId }, orderBy: { observedAt: "desc" }, take: 200 });
  return calculateMarketAggregate(identity, snapshots.map(listingFromSnapshot));
}

export async function storeObservation(input: MarketObservationInput) {
  const identity = identityFromInput(input);
  await prisma.product.upsert({
    where: { id: input.product.id },
    update: { name: input.product.name, imageUrl: input.product.imageUrl ?? undefined, localNumber: input.product.localNumber ?? undefined },
    create: { id: input.product.id, externalId: input.product.id, name: input.product.name, imageUrl: input.product.imageUrl ?? undefined, localNumber: input.product.localNumber ?? undefined, type: "CARD" },
  });
  const baseline = await getMarketAggregate(identity);
  const observedAt = input.observedAt ? new Date(input.observedAt) : new Date();
  const snapshot = await prisma.priceSnapshot.create({ data: {
    productId: input.product.id,
    source: input.source,
    seller: input.seller ?? undefined,
    currency: "BRL",
    price: new Prisma.Decimal(input.price),
    shipping: input.shipping === null || input.shipping === undefined ? undefined : new Prisma.Decimal(input.shipping),
    condition: input.condition as CardCondition | null,
    language: input.language ?? undefined,
    variant: input.variant ?? undefined,
    gradeCompany: input.gradeCompany ?? undefined,
    gradeValue: input.gradeValue === null || input.gradeValue === undefined ? undefined : new Prisma.Decimal(input.gradeValue),
    matchConfidence: input.matchConfidence ?? 1,
    sourceReliability: input.sourceReliability ?? undefined,
    sourceUrl: input.sourceUrl,
    observedAt,
  } });
  const listing = listingFromSnapshot(snapshot);
  const deal = evaluateDeal(listing, baseline);
  const market = await getMarketAggregate(identity);
  if (market.status === "ok" && market.marketPrice !== null && market.lowestPrice !== null && market.medianPrice !== null && market.averagePrice !== null && market.confidence !== null) {
    await prisma.marketAggregate.create({ data: { productId: identity.productId, condition: identity.condition as CardCondition | null, language: identity.language ?? undefined, variant: identity.variant ?? undefined, gradeCompany: identity.gradeCompany ?? undefined, gradeValue: identity.gradeValue === null ? undefined : new Prisma.Decimal(identity.gradeValue), marketPrice: new Prisma.Decimal(market.marketPrice), lowestPrice: new Prisma.Decimal(market.lowestPrice), medianPrice: new Prisma.Decimal(market.medianPrice), averagePrice: new Prisma.Decimal(market.averagePrice), listingCount: market.listingCount, sourceCount: market.sourceCount, confidence: market.confidence, observedAt: market.observedAt ?? observedAt } });
  }
  return { snapshot: listing, baseline, market, deal };
}
