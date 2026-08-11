import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deals = await prisma.offer.findMany({
    orderBy: [{ opportunityScore: "desc" }, { detectedAt: "desc" }],
    take: 100,
    include: { product: true },
  });

  return NextResponse.json({
    deals: deals.map((deal) => ({
      id: deal.id,
      productId: deal.productId,
      name: deal.product.name,
      imageUrl: deal.product.imageUrl,
      source: deal.source,
      seller: deal.seller,
      url: deal.originalUrl,
      price: Number(deal.price),
      referencePrice: deal.referencePrice ? Number(deal.referencePrice) : null,
      discountPercent:
        deal.referencePrice && Number(deal.referencePrice) > 0
          ? Number((((Number(deal.referencePrice) - Number(deal.price)) / Number(deal.referencePrice)) * 100).toFixed(2))
          : null,
      score: deal.opportunityScore,
      detectedAt: deal.detectedAt,
    })),
  });
}
