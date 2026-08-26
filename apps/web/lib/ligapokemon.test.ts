import { describe, expect, it } from "vitest";
import { parseLigaPokemonEditions, parseLigaPokemonSearchResults } from "./ligapokemon";

describe("parseLigaPokemonEditions", () => {
  it("reads the normal min, average and max prices from the Liga page data", () => {
    const html = `<script>var cards_editions = [{"code":"SV01","price":{"0":{"p":"10,50","m":"12,75","g":"1.234,00"}}}];</script>`;
    expect(parseLigaPokemonEditions(html)).toEqual([{ edition: "SV01", lowest: 10.5, average: 12.75, highest: 1234 }]);
  });

  it("does not emit an invented quote when the page has no usable price", () => {
    expect(parseLigaPokemonEditions("<script>var cards_editions = [{\"code\":\"SV01\",\"price\":{}}];</script>")).toEqual([]);
    expect(parseLigaPokemonEditions("<html>not a card page</html>")).toEqual([]);
  });

  it("reads prices and the matching product title from the current Liga search layout", () => {
    const html = `<div class="mtg-name-prod"><a href="./?view=prod/view&pcode=123">Pikachu ex · ME</a></div><div class="mtg-prices"><div class="price-min">R$ 22,00</div><div class="price-avg">R$ 28,50</div><div class="price-max">R$ 33,90</div></div>`;
    expect(parseLigaPokemonSearchResults(html)).toEqual([{ edition: "Pikachu ex · ME", lowest: 22, average: 28.5, highest: 33.9, sourceUrl: "https://www.ligapokemon.com.br/?view=prod/view&pcode=123" }]);
  });
});
