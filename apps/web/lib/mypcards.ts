import type { CardDetail } from "@/types/tcg";

const MYP_CARDS_API_URL = process.env.MYP_CARDS_API_URL ?? "https://mypcards.com/api/v1";

type MypProduct = {
  internal_code?: unknown;
  card_code?: unknown;
  name_pt?: unknown;
  name_en?: unknown;
  edition_pt?: unknown;
  edition_en?: unknown;
  edition_code?: unknown;
  deck_labels?: unknown;
  min_price?: unknown;
  avg_price?: unknown;
  max_price?: unknown;
  available_quantity?: unknown;
  link?: unknown;
};

export type MypCardsPrice = {
  internalCode: number | null;
  cardCode: string;
  edition: string;
  lowest: number | null;
  average: number | null;
  highest: number | null;
  availableQuantity: number | null;
  sourceUrl: string;
};

export type MypCardsQuote = {
  cardName: string;
  sourceUrl: string;
  observedAt: string;
  prices: MypCardsPrice[];
};

type MypCardSearchResponse = { cards?: unknown };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalise(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function sameCardNumber(value: string, source: string) {
  const number = value.trim();
  if (!number) return false;
  const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(source);
}

function productNames(product: MypProduct) {
  return [text(product.name_pt), text(product.name_en)].filter(Boolean);
}

function productSetNames(product: MypProduct) {
  return [text(product.edition_pt), text(product.edition_en), text(product.edition_code)].filter(Boolean);
}

function productNumberSources(product: MypProduct) {
  const labels = Array.isArray(product.deck_labels) ? product.deck_labels.filter((value): value is string => typeof value === "string") : [];
  return [text(product.card_code), ...labels];
}

function setMatches(card: CardDetail, product: MypProduct) {
  const selectedSet = normalise(card.set?.name ?? "");
  if (!selectedSet) return false;
  return productSetNames(product).some((edition) => {
    const normalizedEdition = normalise(edition);
    return normalizedEdition === selectedSet || normalizedEdition.includes(selectedSet) || selectedSet.includes(normalizedEdition);
  });
}

/**
 * A MYP result is usable only when name, printed number and edition all agree.
 * This deliberately returns no result instead of attaching a homonymous card,
 * sealed product, or accessory to the selected catalogue card.
 */
export function selectExactMypCards(card: CardDetail, products: MypProduct[]): MypCardsPrice[] {
  const selectedName = normalise(card.name);
  const selectedNumber = String(card.localId).trim();
  if (!selectedName || !selectedNumber || !card.set?.name) return [];

  return products.flatMap((product): MypCardsPrice[] => {
    const matchesName = productNames(product).some((name) => normalise(name) === selectedName);
    const matchesNumber = productNumberSources(product).some((source) => sameCardNumber(selectedNumber, source));
    const sourceUrl = text(product.link);
    if (!matchesName || !matchesNumber || !setMatches(card, product) || !sourceUrl) return [];

    const edition = text(product.edition_pt) || text(product.edition_en) || text(product.edition_code);
    const cardCode = text(product.card_code);
    return [{
      internalCode: numeric(product.internal_code),
      cardCode,
      edition,
      lowest: numeric(product.min_price),
      average: numeric(product.avg_price),
      highest: numeric(product.max_price),
      availableQuantity: numeric(product.available_quantity),
      sourceUrl,
    }];
  });
}

export async function getMypCardsQuote(card: CardDetail): Promise<MypCardsQuote> {
  const token = process.env.MYP_CARDS_API_TOKEN?.trim();
  if (!token) throw new Error("mypcards_not_configured");

  const cardName = card.name.trim();
  if (!cardName || cardName.length > 120) throw new Error("invalid_card_name");
  const url = `${MYP_CARDS_API_URL}/pokemon/carta/${encodeURIComponent(cardName)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      headers: { "X-Api-Token": token, Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) throw new Error("mypcards_unauthorized");
    if (!response.ok) throw new Error(`mypcards_request_failed_${response.status}`);
    const payload = await response.json() as MypCardSearchResponse;
    const products = Array.isArray(payload.cards) ? payload.cards.filter((item): item is MypProduct => typeof item === "object" && item !== null) : [];
    return {
      cardName,
      sourceUrl: url,
      observedAt: new Date().toISOString(),
      prices: selectExactMypCards(card, products),
    };
  } finally {
    clearTimeout(timeout);
  }
}
