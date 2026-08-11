export type DealSourceType = "TELEGRAM" | "DISCORD" | "WEB" | "RSS" | "MANUAL";

export type RawDealEvent = {
  source: string;
  sourceType: DealSourceType;
  externalMessageId?: string;
  sourceUrl?: string;
  seller?: string;
  text: string;
  postedAt?: Date;
};

export type ParsedDeal = RawDealEvent & {
  name?: string;
  collectorNumber?: string;
  condition?: "NM" | "LP" | "MP" | "HP" | "DAMAGED";
  language?: string;
  price?: number;
  shipping?: number;
  effectivePrice?: number;
  confidence: number;
};

export type MarketBaseline = {
  source: string;
  lowest?: number;
  median?: number;
  listingCount?: number;
  observedAt: Date;
};

export type DealEvaluation = {
  discountAbsolute?: number;
  discountPercent?: number;
  score: number;
  label: "UNKNOWN" | "OK" | "GOOD" | "GREAT" | "EXCELLENT";
  reasons: string[];
};

const BRL_RE = /(?:R\$\s*)?(\d{1,5}(?:[.\s]\d{3})*(?:,\d{2})|\d{1,5}(?:\.\d{2})?)/gi;
const CARD_NUMBER_RE = /(?:#\s*)?(\d{1,3}[a-zA-Z]?)\s*\/\s*(\d{1,3}[a-zA-Z]?)/;
const CONDITION_RE = /\b(NM|LP|MP|HP|DMG|DAMAGED|NEAR\s*MINT|LIGHTLY\s*PLAYED|MODERATELY\s*PLAYED|HEAVILY\s*PLAYED)\b/i;

function moneyToNumber(raw: string): number | undefined {
  const compact = raw.replace(/\s/g, "");
  if (compact.includes(",")) {
    const value = Number(compact.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(value) ? value : undefined;
  }
  const value = Number(compact);
  return Number.isFinite(value) ? value : undefined;
}

function normalizeCondition(raw?: string): ParsedDeal["condition"] {
  if (!raw) return undefined;
  const value = raw.toUpperCase().replace(/\s+/g, " ");
  if (value === "NM" || value === "NEAR MINT") return "NM";
  if (value === "LP" || value === "LIGHTLY PLAYED") return "LP";
  if (value === "MP" || value === "MODERATELY PLAYED") return "MP";
  if (value === "HP" || value === "HEAVILY PLAYED") return "HP";
  if (value === "DMG" || value === "DAMAGED") return "DAMAGED";
  return undefined;
}

function inferName(text: string, numberMatch?: RegExpMatchArray | null): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^https?:\/\//i.test(line))
    .filter((line) => !/^(promo|oferta|deal|desconto|imperd[ií]vel|🔥|🚨)/i.test(line));

  const number = numberMatch?.[0];
  const candidate = lines.find((line) => {
    if (number && line.includes(number)) return true;
    return /[a-zA-ZÀ-ÿ]{3,}/.test(line) && !/R\$|\b(NM|LP|MP|HP|DMG)\b/i.test(line);
  });

  if (!candidate) return undefined;
  return candidate
    .replace(CARD_NUMBER_RE, "")
    .replace(/\b(NM|LP|MP|HP|DMG|DAMAGED)\b/gi, "")
    .replace(/[-–—|]+$/g, "")
    .trim()
    .slice(0, 120) || undefined;
}

export function parseDealMessage(event: RawDealEvent): ParsedDeal {
  const text = event.text.trim();
  const numberMatch = text.match(CARD_NUMBER_RE);
  const conditionMatch = text.match(CONDITION_RE);
  const priceCandidates: number[] = [];

  for (const match of text.matchAll(BRL_RE)) {
    const raw = match[1];
    const value = moneyToNumber(raw);
    if (value && value >= 1 && value <= 100000) priceCandidates.push(value);
  }

  // Prefer values explicitly preceded by R$; otherwise the first realistic value.
  const explicit = [...text.matchAll(/R\$\s*(\d{1,5}(?:\.\d{3})*(?:,\d{2})?|\d{1,5}(?:\.\d{2})?)/gi)]
    .map((m) => moneyToNumber(m[1]))
    .find((v): v is number => Boolean(v));
  const price = explicit ?? priceCandidates[0];
  const collectorNumber = numberMatch ? `${numberMatch[1]}/${numberMatch[2]}` : undefined;
  const condition = normalizeCondition(conditionMatch?.[0]);
  const name = inferName(text, numberMatch);

  let confidence = 0;
  if (price) confidence += 0.42;
  if (name) confidence += 0.28;
  if (collectorNumber) confidence += 0.2;
  if (condition) confidence += 0.1;

  return {
    ...event,
    name,
    collectorNumber,
    condition,
    price,
    effectivePrice: price,
    confidence: Math.min(1, Number(confidence.toFixed(2))),
  };
}

export function evaluateDeal(
  deal: ParsedDeal,
  baseline?: MarketBaseline,
  options?: { matchConfidence?: number; sourceReliability?: number },
): DealEvaluation {
  const reasons: string[] = [];
  const ref = baseline?.lowest ?? baseline?.median;
  let discountAbsolute: number | undefined;
  let discountPercent: number | undefined;

  if (deal.effectivePrice && ref && ref > 0) {
    discountAbsolute = Number((ref - deal.effectivePrice).toFixed(2));
    discountPercent = Number(((discountAbsolute / ref) * 100).toFixed(2));
    reasons.push(`${discountPercent}% abaixo da referência ${baseline?.source ?? "de mercado"}`);
  }

  const matchConfidence = options?.matchConfidence ?? deal.confidence;
  const sourceReliability = options?.sourceReliability ?? 0.5;
  const discountComponent = Math.max(0, Math.min(1, (discountPercent ?? 0) / 50));
  const score = Math.round(
    (discountComponent * 0.55 + matchConfidence * 0.3 + sourceReliability * 0.15) * 100,
  );

  if (matchConfidence < 0.6) reasons.push("correspondência da carta precisa de revisão");
  if (!baseline) reasons.push("sem baseline de mercado disponível");

  const label = score >= 90 ? "EXCELLENT" : score >= 75 ? "GREAT" : score >= 60 ? "GOOD" : score >= 40 ? "OK" : "UNKNOWN";
  return { discountAbsolute, discountPercent, score, label, reasons };
}

export function dealFingerprint(deal: ParsedDeal): string {
  const normalized = [
    deal.name?.toLowerCase().replace(/\s+/g, " ") ?? "unknown",
    deal.collectorNumber ?? "no-number",
    deal.price?.toFixed(2) ?? "no-price",
    deal.seller?.toLowerCase().trim() ?? "no-seller",
  ].join("|");

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
