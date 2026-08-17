import { prisma } from "@/lib/prisma";
import { buildRecommendations, type RecommendationObservation } from "@/lib/recommendations";

export async function getRecommendations() {
  const snapshots = await prisma.priceSnapshot.findMany({
    where: { currency: "BRL" },
    orderBy: { observedAt: "desc" },
    take: 750,
    select: {
      id: true,
      productId: true,
      source: true,
      sourceUrl: true,
      seller: true,
      currency: true,
      price: true,
      shipping: true,
      condition: true,
      language: true,
      variant: true,
      gradeCompany: true,
      gradeValue: true,
      observedAt: true,
      matchConfidence: true,
      sourceReliability: true,
      product: { select: { id: true, name: true, imageUrl: true, localNumber: true, type: true } },
    },
  });

  const observations: RecommendationObservation[] = snapshots.map((snapshot) => ({
    id: snapshot.id,
    productId: snapshot.productId,
    source: snapshot.source,
    sourceUrl: snapshot.sourceUrl ?? "",
    seller: snapshot.seller,
    currency: "BRL",
    price: Number(snapshot.price),
    shipping: snapshot.shipping === null ? null : Number(snapshot.shipping),
    condition: snapshot.condition,
    language: snapshot.language,
    variant: snapshot.variant,
    gradeCompany: snapshot.gradeCompany,
    gradeValue: snapshot.gradeValue === null ? null : Number(snapshot.gradeValue),
    observedAt: snapshot.observedAt,
    detectedAt: snapshot.observedAt,
    matchConfidence: snapshot.matchConfidence,
    sourceReliability: snapshot.sourceReliability,
    product: { ...snapshot.product, type: snapshot.product.type },
  }));

  return buildRecommendations(observations);
}
