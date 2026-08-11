import { NextRequest, NextResponse } from "next/server";
import { getDevUser, prisma } from "@/lib/prisma";
import { getCard, getReferencePrice } from "@/lib/tcgdex";

export const dynamic = "force-dynamic";

const conditions = new Set(["NM", "LP", "MP", "HP"]);

function databaseError(_error: unknown) {
  return NextResponse.json(
    {
      error: "A coleção requer PostgreSQL. Execute `docker compose up --build` ou configure DATABASE_URL.",
    },
    { status: 503 },
  );
}

function serializeItem(item: Awaited<ReturnType<typeof findCollection>>[number]) {
  const snapshot = item.product.prices[0];
  return {
    id: item.id,
    cardId: item.productId,
    name: item.product.name,
    image: item.product.imageUrl ?? undefined,
    setName: item.product.set?.name,
    number: item.product.localNumber ?? undefined,
    rarity: item.product.rarity ?? undefined,
    quantity: item.quantity,
    paidPrice: item.purchasePrice ? Number(item.purchasePrice) : undefined,
    paidCurrency: item.purchasePrice ? "BRL" : undefined,
    condition: item.condition ?? "NM",
    addedAt: item.createdAt.toISOString(),
    reference: snapshot
      ? {
          amount: Number(snapshot.price),
          currency: snapshot.currency,
          source: snapshot.source,
          observedAt: snapshot.observedAt.toISOString(),
        }
      : undefined,
  };
}

async function findCollection(userId: string) {
  return prisma.collectionItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          set: true,
          prices: { orderBy: { observedAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET() {
  try {
    const user = await getDevUser();
    const items = await findCollection(user.id);
    return NextResponse.json({ items: items.map(serializeItem), storage: "postgres" });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { cardId?: string; condition?: string } | null;
  const cardId = body?.cardId?.trim();
  if (!cardId) {
    return NextResponse.json({ error: "Selecione uma carta válida do catálogo." }, { status: 400 });
  }

  const condition = (body?.condition && conditions.has(body.condition) ? body.condition : "NM") as "NM" | "LP" | "MP" | "HP";

  try {
    const [user, card] = await Promise.all([getDevUser(), getCard(cardId)]);
    const reference = getReferencePrice(card);
    const product = await prisma.product.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        localNumber: String(card.localId),
        rarity: card.rarity,
        illustrator: card.illustrator,
        imageUrl: card.image,
        category: card.category,
      },
      create: {
        id: card.id,
        externalId: card.id,
        name: card.name,
        type: "CARD",
        localNumber: String(card.localId),
        rarity: card.rarity,
        illustrator: card.illustrator,
        imageUrl: card.image,
        category: card.category,
        set: card.set
          ? {
              connectOrCreate: {
                where: { id: card.set.id },
                create: {
                  id: card.set.id,
                  name: card.set.name,
                  logoUrl: card.set.logo,
                  symbolUrl: card.set.symbol,
                  totalCards: card.set.cardCount?.total,
                },
              },
            }
          : undefined,
      },
    });

    const item = await prisma.collectionItem.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      update: { quantity: { increment: 1 }, condition },
      create: { userId: user.id, productId: product.id, condition },
    });

    if (reference) {
      await prisma.priceSnapshot.create({
        data: {
          productId: product.id,
          source: reference.source,
          currency: reference.currency,
          price: reference.amount,
          observedAt: new Date(),
        },
      });
    }

    const saved = await prisma.collectionItem.findUniqueOrThrow({
      where: { id: item.id },
      include: {
        product: {
          include: { set: true, prices: { orderBy: { observedAt: "desc" }, take: 1 } },
        },
      },
    });
    return NextResponse.json({ item: serializeItem(saved) }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Informe o item da coleção." }, { status: 400 });

  try {
    const user = await getDevUser();
    await prisma.collectionItem.deleteMany({ where: { id, userId: user.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return databaseError(error);
  }
}
