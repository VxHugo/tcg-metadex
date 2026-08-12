import { describe, expect, it } from "vitest";
import { discountPercent, toSealedOffer, sealedCategories } from "./sealed-products";

describe("sealed products", () => {
  it("only keeps new BRL listings that match the requested sealed category", () => {
    const offer = toSealedOffer({ id: "MLB1", title: "Pokémon Booster Box Mega Evolução", price: 399.9, original_price: 499.9, currency_id: "BRL", condition: "new", permalink: "https://example.test/MLB1", shipping: { free_shipping: true } }, sealedCategories[1], "2026-08-12T15:00:00.000Z");
    expect(offer).toMatchObject({ id: "MLB1", category: "booster-box", discountPercent: 20, freeShipping: true });
    expect(toSealedOffer({ id: "MLB2", title: "Pokémon carta avulsa", price: 10, currency_id: "BRL", condition: "new", permalink: "https://example.test/MLB2" }, sealedCategories[1], "2026-08-12T15:00:00.000Z")).toBeNull();
  });

  it("does not claim a discount without a higher prior price", () => {
    expect(discountPercent(100, null)).toBeNull();
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(80, 100)).toBe(20);
  });
});
