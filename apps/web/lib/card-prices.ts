import type { CardDetail } from "../types/tcg";

export type CardPriceQuote = {
  label: string;
  value: number;
  currency: string;
  source: string;
};

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function tcgplayerQuotes(card: CardDetail): CardPriceQuote[] {
  const tcgplayer = object(card.pricing?.tcgplayer);
  const prices = object(tcgplayer?.prices);
  if (!prices) return [];
  const labels: Record<string, string> = { normal: "Normal", holofoil: "Holo", reverseHolofoil: "Reverse Holo", firstEditionHolofoil: "1ª edição Holo", unlimitedHolofoil: "Unlimited Holo" };
  const quotes: CardPriceQuote[] = [];
  for (const [finish, values] of Object.entries(prices)) {
    const listing = object(values);
    const market = number(listing?.market) ?? number(listing?.mid) ?? number(listing?.low);
    if (market === null) continue;
    quotes.push({ label: `Mercado · ${labels[finish] ?? finish}`, value: market, currency: "USD", source: "TCGplayer via Pokémon TCG API" });
  }
  return quotes;
}

export function cardPriceQuotes(card: CardDetail): CardPriceQuote[] {
  const market = card.pricing?.cardmarket;
  if (!market) return tcgplayerQuotes(card);
  const currency = typeof market.unit === "string" && market.unit ? market.unit : "EUR";
  const candidates: Array<[CardPriceQuote["label"], unknown]> = [
    ["Tendência", market.trend],
    ["Média", market.avg],
    ["Média 7 dias", market.avg7],
    ["Média 30 dias", market.avg30],
    ["Menor preço", market.low],
  ];
  const cardmarketQuotes = candidates.flatMap(([label, value]) => {
    const amount = number(value);
    return amount === null ? [] : [{ label, value: amount, currency, source: "Cardmarket via TCGdex" }];
  });
  return cardmarketQuotes.length ? cardmarketQuotes.map((quote) => ({ ...quote, source: "Cardmarket via Pokémon TCG API" })) : tcgplayerQuotes(card);
}
