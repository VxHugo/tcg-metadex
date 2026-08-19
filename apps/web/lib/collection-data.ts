import { CardCondition, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { summarizePortfolio, type PortfolioSummary } from "@/lib/portfolio";

const devUserEmail = process.env.DEV_USER_EMAIL ?? "local@tcg-metadex.dev";
const validConditions = new Set<CardCondition>(["NM", "LP", "MP", "HP", "DAMAGED"]);

export type CollectionCardInput = {
  id: string;
  name: string;
  image?: string;
  localNumber?: string;
  rarity?: string;
  set?: { id: string; name: string; logo?: string; symbol?: string };
};

export type AddCollectionItemInput = {
  card: CollectionCardInput;
  quantity: number;
  paid: number | null;
  condition: CardCondition;
  purchaseDate: string | null;
  language: string | null;
  variant: string | null;
  notes: string | null;
};

export type PersistedCollectionEntry = {
  id: string;
  cardId: string;
  name: string;
  image?: string;
  setName?: string;
  number?: string;
  rarity?: string;
  quantity: number;
  paid: number | null;
  market: number | null;
  profitLoss: number | null;
  condition: CardCondition;
  purchaseDate: string | null;
  addedAt: string;
};

export async function getLocalUser() {
  return prisma.user.upsert({
    where: { email: devUserEmail },
    update: { displayName: "Hugo" },
    create: { email: devUserEmail, displayName: "Hugo" },
  });
}

function sameProfile(value: string | null, expected: string | null) {
  return value === expected;
}

function latestEquivalentMarket(item: { condition: CardCondition | null; language: string | null; variant: string | null; gradeCompany: string | null; gradeValue: Prisma.Decimal | null; product: { aggregates: Array<{ condition: CardCondition | null; language: string | null; variant: string | null; gradeCompany: string | null; gradeValue: Prisma.Decimal | null; marketPrice: Prisma.Decimal }> } }) {
  const aggregate = item.product.aggregates.find((candidate) =>
    candidate.condition === item.condition
    && sameProfile(candidate.language, item.language)
    && sameProfile(candidate.variant, item.variant)
    && sameProfile(candidate.gradeCompany, item.gradeCompany)
    && (candidate.gradeValue?.equals(item.gradeValue ?? 0) ?? item.gradeValue === null),
  );
  return aggregate ? Number(aggregate.marketPrice) : null;
}

export async function listCollection(): Promise<{ items: PersistedCollectionEntry[]; summary: PortfolioSummary }> {
  const user = await getLocalUser();
  const records = await prisma.collectionItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          set: true,
          aggregates: { orderBy: { observedAt: "desc" }, take: 100 },
        },
      },
    },
  });

  const items = records.map((record) => {
    const market = latestEquivalentMarket(record);
    const paid = record.purchasePrice === null ? null : Number(record.purchasePrice);
    return {
      id: record.id,
      cardId: record.productId,
      name: record.product.name,
      image: record.product.imageUrl ?? undefined,
      setName: record.product.set?.name,
      number: record.product.localNumber ?? undefined,
      rarity: record.product.rarity ?? undefined,
      quantity: record.quantity,
      paid,
      market,
      profitLoss: paid === null || market === null ? null : Math.round(((market - paid) * record.quantity + Number.EPSILON) * 100) / 100,
      condition: record.condition ?? "NM",
      purchaseDate: record.purchaseDate?.toISOString() ?? null,
      addedAt: record.createdAt.toISOString(),
    } satisfies PersistedCollectionEntry;
  });
  return { items, summary: summarizePortfolio(items) };
}

export function parseCollectionInput(value: unknown): AddCollectionItemInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const card = input.card;
  if (!card || typeof card !== "object" || Array.isArray(card)) return null;
  const details = card as Record<string, unknown>;
  const text = (field: unknown) => typeof field === "string" && field.trim() ? field.trim() : null;
  const id = text(details.id);
  const name = text(details.name);
  const quantity = input.quantity === undefined ? 1 : input.quantity;
  const paid = input.paid === null || input.paid === undefined || input.paid === "" ? null : input.paid;
  const condition = input.condition === undefined ? "NM" : input.condition;
  const purchaseDate = input.purchaseDate === null || input.purchaseDate === undefined || input.purchaseDate === "" ? null : text(input.purchaseDate);
  const set = details.set;
  const setDetails = set && typeof set === "object" && !Array.isArray(set) ? set as Record<string, unknown> : null;
  const parsedQuantity = typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 && quantity <= 10000 ? quantity : null;
  const parsedPaid = typeof paid === "number" && Number.isFinite(paid) && paid >= 0 ? paid : null;
  const parsedCondition = typeof condition === "string" && validConditions.has(condition as CardCondition) ? condition as CardCondition : null;
  if (!id || !name || !parsedQuantity || !parsedCondition || (paid !== null && parsedPaid === null) || (purchaseDate && Number.isNaN(new Date(purchaseDate).getTime()))) return null;
  return {
    card: {
      id,
      name,
      image: text(details.image) ?? undefined,
      localNumber: text(details.localNumber) ?? undefined,
      rarity: text(details.rarity) ?? undefined,
      set: setDetails && text(setDetails.id) && text(setDetails.name) ? { id: text(setDetails.id)!, name: text(setDetails.name)!, logo: text(setDetails.logo) ?? undefined, symbol: text(setDetails.symbol) ?? undefined } : undefined,
    },
    quantity: parsedQuantity,
    paid: parsedPaid,
    condition: parsedCondition,
    purchaseDate,
    language: text(input.language),
    variant: text(input.variant),
    notes: text(input.notes),
  };
}

export async function addCollectionItem(input: AddCollectionItemInput) {
  const user = await getLocalUser();
  if (input.card.set) {
    await prisma.set.upsert({
      where: { id: input.card.set.id },
      update: { name: input.card.set.name, logoUrl: input.card.set.logo, symbolUrl: input.card.set.symbol },
      create: { id: input.card.set.id, name: input.card.set.name, logoUrl: input.card.set.logo, symbolUrl: input.card.set.symbol },
    });
  }
  await prisma.product.upsert({
    where: { id: input.card.id },
    update: { name: input.card.name, imageUrl: input.card.image, localNumber: input.card.localNumber, rarity: input.card.rarity, setId: input.card.set?.id },
    create: { id: input.card.id, externalId: input.card.id, name: input.card.name, imageUrl: input.card.image, localNumber: input.card.localNumber, rarity: input.card.rarity, setId: input.card.set?.id, type: "CARD" },
  });
  await prisma.collectionItem.create({
    data: {
      userId: user.id,
      productId: input.card.id,
      quantity: input.quantity,
      purchasePrice: input.paid === null ? undefined : new Prisma.Decimal(input.paid),
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      condition: input.condition,
      language: input.language ?? undefined,
      variant: input.variant ?? undefined,
      notes: input.notes ?? undefined,
    },
  });
  return listCollection();
}

export async function deleteCollectionItem(id: string) {
  const user = await getLocalUser();
  const result = await prisma.collectionItem.deleteMany({ where: { id, userId: user.id } });
  return result.count === 1;
}
