import { prisma } from "@/lib/prisma";
import { getCard, searchCards } from "@/lib/tcgdex";
import { notifyDeal } from "@/lib/deal-notifications";
import {
  dealFingerprint,
  evaluateDeal,
  parseDealMessage,
  type MarketBaseline,
  type ParsedDeal,
  type RawDealEvent,
} from "@/lib/deal-radar";

const LIGA_SOURCE_NAMES = ["LigaPokemon", "Liga Pokemon", "Liga Pokémon", "LigaPokemon BR"];

export async function resolveDealCard(deal: ParsedDeal) {
  if (!deal.name) return undefined;

  const dbCandidates = await prisma.product.findMany({
    where: {
      type: "CARD",
      name: { contains: deal.name, mode: "insensitive" },
      ...(deal.collectorNumber ? { localNumber: { contains: deal.collectorNumber.split("/")[0] } } : {}),
    },
    take: 5,
  });

  if (dbCandidates.length === 1) return { product: dbCandidates[0], confidence: 0.98 };

  const external = await searchCards(deal.name, 10);
  const wantedLocal = deal.collectorNumber?.split("/")[0]?.toLowerCase();
  const ranked = external
    .map((card) => {
      let confidence = card.name.toLowerCase() === deal.name?.toLowerCase() ? 0.72 : 0.55;
      if (wantedLocal && String(card.localId).toLowerCase() === wantedLocal) confidence += 0.25;
      return { card, confidence: Math.min(0.99, confidence) };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const winner = ranked[0];
  if (!winner || winner.confidence < 0.6) return undefined;

  const detail = await getCard(winner.card.id);
  const set = detail.set
    ? await prisma.set.upsert({
        where: { id: detail.set.id },
        create: {
          id: detail.set.id,
          name: detail.set.name,
          logoUrl: detail.set.logo,
          symbolUrl: detail.set.symbol,
          totalCards: detail.set.cardCount?.total,
        },
        update: {
          name: detail.set.name,
          logoUrl: detail.set.logo,
          symbolUrl: detail.set.symbol,
          totalCards: detail.set.cardCount?.total,
        },
      })
    : undefined;

  const product = await prisma.product.upsert({
    where: { id: detail.id },
    create: {
      id: detail.id,
      externalId: detail.id,
      name: detail.name,
      type: "CARD",
      setId: set?.id,
      localNumber: String(detail.localId),
      rarity: detail.rarity,
      illustrator: detail.illustrator,
      imageUrl: detail.image ? `${detail.image}/high.webp` : undefined,
      category: detail.category,
    },
    update: {
      name: detail.name,
      setId: set?.id,
      localNumber: String(detail.localId),
      rarity: detail.rarity,
      illustrator: detail.illustrator,
      imageUrl: detail.image ? `${detail.image}/high.webp` : undefined,
      category: detail.category,
    },
  });

  return { product, confidence: winner.confidence };
}

export async function getLigaBaseline(productId: string, deal: ParsedDeal): Promise<MarketBaseline | undefined> {
  const rows = await prisma.priceSnapshot.findMany({
    where: {
      productId,
      source: { in: LIGA_SOURCE_NAMES },
      ...(deal.condition ? { condition: deal.condition } : {}),
      ...(deal.language ? { language: deal.language } : {}),
    },
    orderBy: { observedAt: "desc" },
    take: 30,
  });

  if (!rows.length) return undefined;
  const freshCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const fresh = rows.filter((row) => row.observedAt.getTime() >= freshCutoff);
  const usable = fresh.length ? fresh : rows.slice(0, 10);
  const values = usable.map((row) => Number(row.price) + Number(row.shipping ?? 0)).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;

  return {
    source: "Liga Pokémon",
    lowest: values[0],
    median: Number(median.toFixed(2)),
    listingCount: usable.length,
    observedAt: usable[0].observedAt,
  };
}

export async function processDealEvent(event: RawDealEvent) {
  const parsed = parseDealMessage(event);
  const fingerprint = dealFingerprint(parsed);

  if (!parsed.price || parsed.confidence < 0.5) {
    return { status: "NEEDS_REVIEW" as const, parsed, fingerprint };
  }

  const resolved = await resolveDealCard(parsed);
  if (!resolved) return { status: "NEEDS_REVIEW" as const, parsed, fingerprint };

  const baseline = await getLigaBaseline(resolved.product.id, parsed);
  const evaluation = evaluateDeal(parsed, baseline, { matchConfidence: resolved.confidence });

  const recentWindow = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const duplicate = await prisma.offer.findFirst({
    where: {
      productId: resolved.product.id,
      price: parsed.price,
      source: parsed.source,
      detectedAt: { gte: recentWindow },
      ...(parsed.sourceUrl ? { originalUrl: parsed.sourceUrl } : {}),
    },
    orderBy: { detectedAt: "desc" },
  });

  if (duplicate) {
    return { status: "DUPLICATE" as const, parsed, fingerprint, evaluation, offer: duplicate };
  }

  const referencePrice = baseline?.lowest ?? baseline?.median;
  const offer = await prisma.offer.create({
    data: {
      productId: resolved.product.id,
      source: parsed.source,
      seller: parsed.seller,
      originalUrl: parsed.sourceUrl,
      currency: "BRL",
      price: parsed.price,
      shipping: parsed.shipping,
      referencePrice,
      opportunityScore: evaluation.score,
      detectedAt: new Date(),
    },
  });

  const isOpportunity = evaluation.discountPercent !== undefined && evaluation.discountPercent >= 10;
  if (isOpportunity) {
    await notifyDeal({
      title: resolved.product.name,
      source: parsed.source,
      sourceUrl: parsed.sourceUrl,
      price: parsed.price,
      referencePrice,
      discountPercent: evaluation.discountPercent,
      score: evaluation.score,
    }).catch(() => undefined);
  }

  return {
    status: isOpportunity ? "OPPORTUNITY" as const : "RECORDED" as const,
    parsed,
    fingerprint,
    evaluation,
    baseline,
    product: resolved.product,
    offer,
  };
}
