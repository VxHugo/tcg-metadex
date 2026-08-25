import { describe, expect, it } from "vitest";
import { mapPokemonCard } from "./tcgdex";

describe("Pokemon TCG API catalog adapter", () => {
  it("keeps provider identity separate from TCGdex IDs", () => {
    const card = mapPokemonCard({
      id: "sv4-1", name: "Pikachu ex", number: "001", images: { small: "https://img.test/pika.png" }, set: { id: "sv4", name: "Paradox Rift", printedTotal: 182, total: 266 },
    });
    expect(card).toMatchObject({ id: "pokemon-tcg:sv4-1", localId: "001", source: "Pokemon TCG API", image: "https://img.test/pika.png" });
    expect(card.set?.cardCount).toEqual({ official: 182, total: 266 });
  });
});
