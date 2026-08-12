import type { CardBrief, CardDetail } from "@/types/tcg";

const BASE_URL = process.env.TCGDEX_API_URL ?? "https://api.tcgdex.net/v2/en";

function encode(value: string) {
  return encodeURIComponent(value.trim());
}

export function cardImage(image?: string, quality: "low" | "high" = "high") {
  if (!image) return undefined;
  if (/\.(webp|png|jpe?g)$/i.test(image)) return image;
  return `${image}/${quality}.webp`;
}

export async function searchCards(query: string, limit = 18): Promise<CardBrief[]> {
  const clean = query.trim();
  if (!clean) return [];

  const url = `${BASE_URL}/cards?name=${encode(clean)}&pagination:page=1&pagination:itemsPerPage=${limit}`;
  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(`TCGdex search failed (${response.status})`);
  }

  return (await response.json()) as CardBrief[];
}

export async function getCard(id: string): Promise<CardDetail> {
  const response = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`TCGdex card failed (${response.status})`);
  }

  return (await response.json()) as CardDetail;
}
