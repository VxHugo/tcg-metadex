export type LigaPokemonPrice = {
  edition: string;
  lowest: number;
  average: number;
  highest: number;
};

export type LigaPokemonQuote = {
  cardName: string;
  sourceUrl: string;
  observedAt: string;
  prices: LigaPokemonPrice[];
};

type LigaEditionPayload = {
  code?: unknown;
  price?: unknown;
};

function parseBrazilianMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function priceObject(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return priceObject(value[0]);
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const normal = record["0"] ?? record[0];
  return typeof normal === "object" && normal !== null && !Array.isArray(normal)
    ? normal as Record<string, unknown>
    : null;
}

export function parseLigaPokemonEditions(html: string): LigaPokemonPrice[] {
  const match = html.match(/(?:var|let|const)\s+cards_editions\s*=\s*(\[[\s\S]*?\])\s*;/i);
  if (!match) return [];

  let editions: unknown;
  try {
    editions = JSON.parse(match[1]);
  } catch {
    return [];
  }
  if (!Array.isArray(editions)) return [];

  return editions.flatMap((edition): LigaPokemonPrice[] => {
    if (typeof edition !== "object" || edition === null) return [];
    const payload = edition as LigaEditionPayload;
    if (typeof payload.code !== "string" || !payload.code.trim()) return [];
    const normal = priceObject(payload.price);
    if (!normal) return [];
    const lowest = parseBrazilianMoney(normal.p);
    const average = parseBrazilianMoney(normal.m);
    const highest = parseBrazilianMoney(normal.g);
    if (lowest === null && average === null && highest === null) return [];
    return [{ edition: payload.code.trim(), lowest: lowest ?? 0, average: average ?? 0, highest: highest ?? 0 }];
  });
}
