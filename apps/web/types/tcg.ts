export type CardBrief = {
  id: string;
  localId: string | number;
  name: string;
  image?: string;
};

export type CardPricing = {
  cardmarket?: {
    updated?: string;
    unit?: string;
    avg?: number;
    low?: number;
    trend?: number;
    avg1?: number;
    avg7?: number;
    avg30?: number;
    [key: string]: unknown;
  };
  tcgplayer?: Record<string, unknown>;
};

export type PriceReference = {
  amount: number;
  currency: string;
  source: string;
  observedAt: string;
};

export type CardDetail = CardBrief & {
  category?: string;
  rarity?: string;
  illustrator?: string;
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: { official?: number; total?: number };
  };
  variants?: {
    normal?: boolean;
    reverse?: boolean;
    holo?: boolean;
    firstEdition?: boolean;
  };
  pricing?: CardPricing;
  updated?: string;
};

export type CollectionEntry = {
  id: string;
  cardId: string;
  name: string;
  image?: string;
  setName?: string;
  number?: string;
  rarity?: string;
  quantity: number;
  paidPrice?: number;
  paidCurrency?: string;
  reference?: PriceReference;
  condition: "NM" | "LP" | "MP" | "HP";
  addedAt: string;
};

export type Opportunity = {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  price: number;
  market: number;
  score: number;
  source: string;
};

export type ScanCandidate = {
  id: string;
  name: string;
  number?: string;
  setName?: string;
  image?: string;
  confidence: number;
  reference?: PriceReference;
};
