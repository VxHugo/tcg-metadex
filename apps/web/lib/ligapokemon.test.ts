import { describe, expect, it } from "vitest";
import { ligaPokemonCardUrl, parseLigaPokemonEditions, parseLigaPokemonSearchResults } from "./ligapokemon";

describe("parseLigaPokemonEditions", () => {
  it("reads the normal min, average and max prices from the Liga page data", () => {
    const html = `<script>var cards_editions = [{"code":"SV01","price":{"0":{"p":"10,50","m":"12,75","g":"1.234,00"}}}];</script>`;
    expect(parseLigaPokemonEditions(html)).toEqual([{ edition: "SV01", lowest: 10.5, average: 12.75, highest: 1234 }]);
  });

  it("keeps decimal points from the Liga JSON price payload", () => {
    const html = `<script>var cards_editions = [{"code":"BS","price":{"0":{"p":"25.00","m":"75.63","g":"139.90"}}}];</script>`;
    expect(parseLigaPokemonEditions(html)).toEqual([{ edition: "BS", lowest: 25, average: 75.63, highest: 139.9 }]);
  });

  it("does not emit an invented quote when the page has no usable price", () => {
    expect(parseLigaPokemonEditions("<script>var cards_editions = [{\"code\":\"SV01\",\"price\":{}}];</script>")).toEqual([]);
    expect(parseLigaPokemonEditions("<html>not a card page</html>")).toEqual([]);
  });

  it("reads prices and the matching product title from the current Liga search layout", () => {
    const html = `<div class="mtg-name-prod"><a href="./?view=prod/view&pcode=123">Pikachu ex · ME</a></div><div class="mtg-prices"><div class="price-min">R$ 22,00</div><div class="price-avg">R$ 28,50</div><div class="price-max">R$ 33,90</div></div>`;
    expect(parseLigaPokemonSearchResults(html)).toEqual([{ edition: "Pikachu ex · ME", lowest: 22, average: 28.5, highest: 33.9, sourceUrl: "https://www.ligapokemon.com.br/?view=prod/view&pcode=123" }]);
  });

  it("builds a direct Liga URL using the card number and edition", () => {
    expect(ligaPokemonCardUrl({ name: "Pikachu", number: "58", setCode: "BS", total: 102 }).toString()).toBe("https://www.ligapokemon.com.br/?view=cards%2Fcard&card=Pikachu+%2858%2F102%29&ed=BS&num=58");
  });
});
