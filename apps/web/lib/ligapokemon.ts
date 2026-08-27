import https from "node:https";

export type LigaPokemonPrice = {
  edition: string;
  lowest: number;
  average: number;
  highest: number;
  sourceUrl?: string;
};

export type LigaPokemonQuote = {
  cardName: string;
  sourceUrl: string;
  observedAt: string;
  prices: LigaPokemonPrice[];
};

export type LigaPokemonCardIdentity = {
  name: string;
  number: string | number;
  setCode: string;
  total?: string | number;
};

type LigaEditionPayload = {
  code?: unknown;
  price?: unknown;
};

const BASE_URL = "https://www.ligapokemon.com.br/";
const MINIMUM_INTERVAL_MS = 650;
let nextRequestAt = 0;

function parseBrazilianMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "");
  // The Liga JSON uses a dot decimal separator ("25.00"), while visible BRL
  // markup uses a comma decimal separator ("1.234,00").
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
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

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&atilde;/gi, "ã")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&([a-z]+);/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function priceFromSection(section: string, className: string) {
  const match = section.match(new RegExp(`<div\\s+class="${className}">([\\s\\S]*?)<\\/div>`, "i"));
  return match ? parseBrazilianMoney(decodeHtml(match[1])) : null;
}

/** Reads the currently rendered Liga search cards. The page stopped exposing cards_editions on search pages in 2026. */
export function parseLigaPokemonSearchResults(html: string): LigaPokemonPrice[] {
  const titleMatches = Array.from(html.matchAll(/<div\s+class="mtg-name-prod">[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi));
  return titleMatches.flatMap((match, index): LigaPokemonPrice[] => {
    const start = match.index ?? 0;
    const end = titleMatches[index + 1]?.index ?? html.length;
    const section = html.slice(start, end);
    const title = decodeHtml(match[2]);
    const lowest = priceFromSection(section, "price-min");
    const average = priceFromSection(section, "price-avg");
    const highest = priceFromSection(section, "price-max");
    if (!title || (lowest === null && average === null && highest === null)) return [];
    return [{
      edition: title,
      lowest: lowest ?? 0,
      average: average ?? 0,
      highest: highest ?? 0,
      sourceUrl: new URL(match[1], BASE_URL).toString(),
    }];
  });
}

async function respectRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + MINIMUM_INTERVAL_MS;
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
}

function getPublicHtml(url: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`ligapokemon_request_failed_${response.statusCode ?? 0}`));
        return;
      }
      response.setEncoding("utf8");
      let html = "";
      response.on("data", (chunk: string) => {
        html += chunk;
        if (html.length > 1_500_000) request.destroy(new Error("ligapokemon_response_too_large"));
      });
      response.on("end", () => resolve(html));
    });
    request.setTimeout(15_000, () => request.destroy(new Error("ligapokemon_timeout")));
    request.on("error", reject);
  });
}

export function ligaPokemonCardUrl(card: LigaPokemonCardIdentity) {
  const name = card.name.trim();
  const number = String(card.number).trim();
  const setCode = card.setCode.trim();
  const total = card.total === undefined ? "" : String(card.total).trim();
  if (!name || !number || !setCode || name.length > 120 || number.length > 40 || setCode.length > 30) throw new Error("invalid_card_identity");
  const url = new URL(BASE_URL);
  url.searchParams.set("view", "cards/card");
  url.searchParams.set("card", total ? `${name} (${number}/${total})` : `${name} (${number})`);
  url.searchParams.set("ed", setCode);
  url.searchParams.set("num", number);
  return url;
}

export async function getLigaPokemonQuote(card: LigaPokemonCardIdentity): Promise<LigaPokemonQuote> {
  const trimmedName = card.name.trim();
  const url = ligaPokemonCardUrl(card);
  await respectRateLimit();
  const html = await getPublicHtml(url);
  return {
    cardName: trimmedName,
    sourceUrl: url.toString(),
    observedAt: new Date().toISOString(),
    // The current public search page mixes cards, sealed products and accessories.
    // Without a verified set/number mapping, returning those rows as a card quote
    // would mislabel a random product as the selected card.
    prices: parseLigaPokemonEditions(html),
  };
}
