import type { CardBrief, CardDetail, TcgSetBrief } from "@/types/tcg";

const BASE_URL = process.env.TCGDEX_API_URL ?? "https://api.tcgdex.net/v2/en";
const POKEMON_TCG_API_URL = process.env.POKEMON_TCG_API_URL ?? "https://api.pokemontcg.io/v2";
const POKEMON_TCG_PREFIX = "pokemon-tcg:";

type PokemonTcgApiCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  artist?: string;
  images?: { small?: string; large?: string };
  set?: { id: string; name: string; ptcgoCode?: string; images?: { logo?: string; symbol?: string }; printedTotal?: number; total?: number };
  tcgplayer?: Record<string, unknown>;
  cardmarket?: {
    updatedAt?: string;
    prices?: {
      trendPrice?: number;
      averageSellPrice?: number;
      lowPrice?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
    };
  };
  updatedAt?: string;
};

function encode(value: string) {
  return encodeURIComponent(value.trim());
}

export function cardImage(image?: string, quality: "low" | "high" = "high") {
  if (!image) return undefined;
  if (/\.(webp|png|jpe?g)$/i.test(image)) return image;
  return `${image}/${quality}.webp`;
}

function catalogProvider() {
  return process.env.CATALOG_PROVIDER === "tcgdex" ? "tcgdex" : "pokemontcg";
}

function pokemonHeaders() {
  return process.env.POKEMON_TCG_API_KEY ? { "X-Api-Key": process.env.POKEMON_TCG_API_KEY } : undefined;
}

export function mapPokemonCard(card: PokemonTcgApiCard): CardDetail {
  const cardmarket = card.cardmarket?.prices;
  return {
    id: `${POKEMON_TCG_PREFIX}${card.id}`,
    localId: card.number,
    name: card.name,
    image: card.images?.large ?? card.images?.small,
    rarity: card.rarity,
    illustrator: card.artist,
    set: card.set ? {
      id: card.set.id,
      name: card.set.name,
      code: card.set.ptcgoCode,
      logo: card.set.images?.logo,
      symbol: card.set.images?.symbol,
      cardCount: { official: card.set.printedTotal, total: card.set.total },
    } : undefined,
    pricing: card.tcgplayer || cardmarket ? {
      ...(card.tcgplayer ? { tcgplayer: card.tcgplayer } : {}),
      ...(cardmarket ? {
        cardmarket: {
          updated: card.cardmarket?.updatedAt,
          unit: "EUR",
          trend: cardmarket.trendPrice,
          avg: cardmarket.averageSellPrice,
          low: cardmarket.lowPrice,
          avg1: cardmarket.avg1,
          avg7: cardmarket.avg7,
          avg30: cardmarket.avg30,
        },
      } : {}),
    } : undefined,
    updated: card.updatedAt,
    source: "Pokemon TCG API",
  };
}

async function pokemonSearch(query: string, limit: number): Promise<CardBrief[]> {
  const params = new URLSearchParams({ q: `name:"${query.replaceAll('"', "")}"`, page: "1", pageSize: String(limit) });
  const response = await fetch(`${POKEMON_TCG_API_URL}/cards?${params}`, { headers: pokemonHeaders(), next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Pokemon TCG API search failed (${response.status})`);
  const payload = await response.json() as { data?: PokemonTcgApiCard[] };
  return (payload.data ?? []).map((card) => {
    const mapped = mapPokemonCard(card);
    return { id: mapped.id, name: mapped.name, localId: mapped.localId, image: mapped.image };
  });
}

async function pokemonCard(id: string): Promise<CardDetail> {
  const response = await fetch(`${POKEMON_TCG_API_URL}/cards/${encodeURIComponent(id)}`, { headers: pokemonHeaders(), next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Pokemon TCG API card failed (${response.status})`);
  const payload = await response.json() as { data?: PokemonTcgApiCard };
  if (!payload.data) throw new Error("Pokemon TCG API returned no card");
  return mapPokemonCard(payload.data);
}

export async function searchCards(query: string, limit = 18): Promise<CardBrief[]> {
  const clean = query.trim();
  if (!clean) return [];
  if (catalogProvider() === "pokemontcg") return pokemonSearch(clean, limit);

  const url = `${BASE_URL}/cards?name=${encode(clean)}&pagination:page=1&pagination:itemsPerPage=${limit}`;
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`TCGdex search failed (${response.status})`);
    return (await response.json()) as CardBrief[];
  } catch (error) {
    try {
      return await pokemonSearch(clean, limit);
    } catch {
      throw error;
    }
  }
}

export async function getCard(id: string): Promise<CardDetail> {
  if (id.startsWith(POKEMON_TCG_PREFIX)) return pokemonCard(id.slice(POKEMON_TCG_PREFIX.length));
  try {
    const response = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`TCGdex card failed (${response.status})`);
    return { ...(await response.json()) as CardDetail, source: "TCGdex" };
  } catch (error) {
    try {
      return await pokemonCard(id);
    } catch {
      throw error;
    }
  }
}

export async function searchSets(query: string, limit = 24): Promise<TcgSetBrief[]> {
  const params = new URLSearchParams({ "pagination:page": "1", "pagination:itemsPerPage": String(limit) });
  if (query.trim()) params.set("name", query.trim());
  const response = await fetch(`${BASE_URL}/sets?${params}`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`TCGdex set search failed (${response.status})`);
  return (await response.json()) as TcgSetBrief[];
}
