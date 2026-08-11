import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const expected = process.env.DEAL_RADAR_INTERNAL_TOKEN;
  if (!expected) return NextResponse.json({ error: "DEAL_RADAR_INTERNAL_TOKEN is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId?: string;
    source?: string;
    price?: number;
    shipping?: number;
    seller?: string;
    sourceUrl?: string;
    condition?: "NM" | "LP" | "MP" | "HP" | "DAMAGED";
    language?: string;
    variant?: string;
    observedAt?: string;
  };

  if (!body.productId || !body.source || !Number.isFinite(body.price) || Number(body.price) <= 0) {
    return NextResponse.json({ error: "productId, source and positive price are required" }, { status: 400 });
  }

  const snapshot = await prisma.priceSnapshot.create({
    data: {
      productId: body.productId,
      source: body.source,
      seller: body.seller,
      currency: "BRL",
      price: Number(body.price),
      shipping: body.shipping,
      condition: body.condition,
      language: body.language,
      variant: body.variant,
      sourceUrl: body.sourceUrl,
      observedAt: body.observedAt ? new Date(body.observedAt) : new Date(),
    },
  });

  return NextResponse.json({ ok: true, snapshot });
}
