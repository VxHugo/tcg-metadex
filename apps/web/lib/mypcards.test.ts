import { describe, expect, it } from "vitest";
import { selectExactMypCards } from "./mypcards";

const card = {
  id: "sv3-160",
  localId: "160",
  name: "Pikachu",
  set: { id: "sv3", name: "Obsidian Flames" },
};

describe("selectExactMypCards", () => {
  it("keeps only the exact name, printed number and edition", () => {
    const result = selectExactMypCards(card, [
      { name_en: "Pikachu", card_code: "OBF-160", edition_en: "Obsidian Flames", min_price: "12.50", avg_price: "18.00", max_price: "30.00", available_quantity: 4, link: "https://mypcards.com/pokemon/produto/1/pikachu" },
      { name_en: "Pikachu", card_code: "SVP-160", edition_en: "Scarlet & Violet Black Star Promos", min_price: "999.00", link: "https://mypcards.com/pokemon/produto/2/pikachu" },
      { name_en: "Pikachu ex", card_code: "OBF-160", edition_en: "Obsidian Flames", min_price: "888.00", link: "https://mypcards.com/pokemon/produto/3/pikachu-ex" },
    ]);

    expect(result).toEqual([{
      internalCode: null,
      cardCode: "OBF-160",
      edition: "Obsidian Flames",
      lowest: 12.5,
      average: 18,
      highest: 30,
      availableQuantity: 4,
      sourceUrl: "https://mypcards.com/pokemon/produto/1/pikachu",
    }]);
  });

  it("does not treat a homonymous product from another set as a quote", () => {
    expect(selectExactMypCards(card, [{ name_pt: "Pikachu", card_code: "SVP-160", edition_pt: "Promos Black Star", min_price: "10.00", link: "https://mypcards.com/pokemon/produto/2/pikachu" }])).toEqual([]);
  });
});
