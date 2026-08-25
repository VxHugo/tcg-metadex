import type { BuyRecommendation } from "./recommendations";

export function dealDeduplicationKey(deal: BuyRecommendation) {
  return `${deal.sourceUrl.trim()}|${deal.offerPrice.toFixed(2)}`;
}

export function formatDealAlert(deal: BuyRecommendation) {
  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  return [
    "ACHADO VERIFICADO · TCG METADEX",
    deal.productName,
    `${money(deal.offerPrice)} · ${deal.discountPercent}% abaixo da referência`,
    `Referência: ${money(deal.referencePrice)} · ${deal.referenceListings} observações`,
    `Fonte: ${deal.source}${deal.seller ? ` · ${deal.seller}` : ""}`,
    deal.sourceUrl,
    "Confira lacre, idioma e condições antes de comprar.",
  ].join("\n");
}
