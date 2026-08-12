export const sealedCategoryIds = ["pack", "booster-box", "blister", "etb", "collection-box", "premium", "deck"] as const;

export type SealedCategoryId = typeof sealedCategoryIds[number];

export type SealedCategory = {
  id: SealedCategoryId;
  label: string;
  description: string;
  query: string;
  sourceUrl: string;
  titleTerms: string[];
};

export type SealedOffer = {
  id: string;
  title: string;
  category: SealedCategoryId;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  currency: "BRL";
  thumbnail: string | null;
  source: "Mercado Livre";
  sourceUrl: string;
  seller: string | null;
  freeShipping: boolean;
  observedAt: string;
};

export type SealedOffersResponse = {
  status: "ok" | "source_not_configured" | "source_unavailable";
  offers: SealedOffer[];
  categories: SealedCategory[];
  message: string;
  observedAt: string | null;
};

type MercadoLivreResult = {
  id?: unknown;
  title?: unknown;
  price?: unknown;
  original_price?: unknown;
  currency_id?: unknown;
  thumbnail?: unknown;
  permalink?: unknown;
  seller?: { nickname?: unknown };
  shipping?: { free_shipping?: unknown };
  condition?: unknown;
};

type MercadoLivreSearchResponse = { results?: unknown };

export const sealedCategories: SealedCategory[] = [
  { id: "pack", label: "Packs e boosters", description: "Pacotes avulsos e combos para abrir.", query: "pokemon booster", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-booster", titleTerms: ["booster", "pack", "pacote"] },
  { id: "booster-box", label: "Booster boxes", description: "Displays e caixas fechadas para coleção ou abertura.", query: "pokemon booster box", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-booster-box", titleTerms: ["booster box", "box", "display"] },
  { id: "blister", label: "Blisters e tripacks", description: "Blisters unitários, duplos e triplos.", query: "pokemon blister", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-blister", titleTerms: ["blister", "tripack", "tri pack"] },
  { id: "etb", label: "Elite Trainer Boxes", description: "ETBs e caixas especiais de expansão.", query: "pokemon elite trainer box", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-elite-trainer-box", titleTerms: ["elite trainer", "etb"] },
  { id: "collection-box", label: "Boxes de coleção", description: "Coleções com promos, boosters e acessórios.", query: "pokemon box coleção", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-box-colecao", titleTerms: ["box", "coleção", "collection"] },
  { id: "premium", label: "Premium e tins", description: "Coleções premium, ultra premium e latas.", query: "pokemon coleção premium", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-colecao-premium", titleTerms: ["premium", "ultra", "tin", "lata"] },
  { id: "deck", label: "Baralhos", description: "Decks prontos, League Battle e kits de jogo.", query: "pokemon deck league battle", sourceUrl: "https://lista.mercadolivre.com.br/pokemon-deck", titleTerms: ["deck", "baralho", "battle"] },
];

export function isSealedCategoryId(value: string | null): value is SealedCategoryId {
  return value !== null && sealedCategoryIds.includes(value as SealedCategoryId);
}

export function discountPercent(price: number, originalPrice: number | null) {
  if (originalPrice === null || originalPrice <= price || price < 0) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 10000) / 100;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function price(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function toSealedOffer(result: MercadoLivreResult, category: SealedCategory, observedAt: string): SealedOffer | null {
  const id = text(result.id);
  const title = text(result.title);
  const value = price(result.price);
  const sourceUrl = text(result.permalink);
  const normalizedTitle = title?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR") ?? "";
  const matchesCategory = category.titleTerms.some((term) => normalizedTitle.includes(term));
  if (!id || !title || value === null || !sourceUrl || text(result.currency_id) !== "BRL" || result.condition !== "new" || !normalizedTitle.includes("pokemon") || !matchesCategory) return null;

  const prior = price(result.original_price);
  const originalPrice = prior !== null && prior > value ? prior : null;
  return {
    id,
    title,
    category: category.id,
    price: value,
    originalPrice,
    discountPercent: discountPercent(value, originalPrice),
    currency: "BRL",
    thumbnail: text(result.thumbnail),
    source: "Mercado Livre",
    sourceUrl,
    seller: text(result.seller?.nickname),
    freeShipping: result.shipping?.free_shipping === true,
    observedAt,
  };
}

export async function getSealedOffers(categoryId: SealedCategoryId): Promise<SealedOffersResponse> {
  const category = sealedCategories.find((entry) => entry.id === categoryId) ?? sealedCategories[0];
  const token = process.env.MELI_ACCESS_TOKEN;
  if (!token) {
    return {
      status: "source_not_configured",
      offers: [],
      categories: sealedCategories,
      message: "O radar automático do Mercado Livre precisa de uma credencial de aplicativo autorizada. Enquanto isso, cada categoria abre a busca atualizada diretamente na fonte.",
      observedAt: null,
    };
  }

  const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
  url.searchParams.set("q", category.query);
  url.searchParams.set("limit", "24");

  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Mercado Livre search failed (${response.status})`);
    const payload = await response.json() as MercadoLivreSearchResponse;
    const observedAt = new Date().toISOString();
    const results = Array.isArray(payload.results) ? payload.results : [];
    const offers = results.map((result) => toSealedOffer(result as MercadoLivreResult, category, observedAt)).filter((offer): offer is SealedOffer => offer !== null);
    return { status: "ok", offers, categories: sealedCategories, message: "Ofertas consultadas diretamente na fonte. Confirme lacre, edição e condições antes de comprar.", observedAt };
  } catch {
    return {
      status: "source_unavailable",
      offers: [],
      categories: sealedCategories,
      message: "A fonte não respondeu agora. Abra a busca da categoria para consultar as ofertas diretamente.",
      observedAt: null,
    };
  }
}
