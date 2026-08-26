import { describe, expect, it } from "vitest";
import { parseLigaPokemonEditions } from "./ligapokemon";

describe("parseLigaPokemonEditions", () => {
  it("reads the normal min, average and max prices from the Liga page data", () => {
    const html = `<script>var cards_editions = [{"code":"SV01","price":{"0":{"p":"10,50","m":"12,75","g":"1.234,00"}}}];</script>`;
    expect(parseLigaPokemonEditions(html)).toEqual([{ edition: "SV01", lowest: 10.5, average: 12.75, highest: 1234 }]);
  });

  it("does not emit an invented quote when the page has no usable price", () => {
    expect(parseLigaPokemonEditions("<script>var cards_editions = [{\"code\":\"SV01\",\"price\":{}}];</script>")).toEqual([]);
    expect(parseLigaPokemonEditions("<html>not a card page</html>")).toEqual([]);
  });
});
