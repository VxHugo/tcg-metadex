import type { CardDetail } from "../types/tcg";

export type CardPriceQuote = {
  label: "Tendência" | "Média" | "Média 7 dias" | "Média 30 dias" | "Menor preço";
  value: number;
  currency: string;
  source: string;
};

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function cardPriceQuotes(card: CardDetail): CardPriceQuote[] {
  const market = card.pricing?.cardmarket;
  if (!market) return [];
  const currency = typeof market.unit === "string" && market.unit ? market.unit : "EUR";
  const candidates: Array<[CardPriceQuote["label"], unknown]> = [
    ["Tendência", market.trend],
    ["Média", market.avg],
    ["Média 7 dias", market.avg7],
    ["Média 30 dias", market.avg30],
    ["Menor preço", market.low],
  ];
  return candidates.flatMap(([label, value]) => {
    const amount = number(value);
    return amount === null ? [] : [{ label, value: amount, currency, source: "Cardmarket via TCGdex" }];
  });
}
