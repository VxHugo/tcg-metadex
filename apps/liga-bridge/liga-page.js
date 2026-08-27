function money(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/R\$/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readQuote() {
  const match = document.documentElement.innerHTML.match(/(?:var|let|const)\s+cards_editions\s*=\s*(\[[\s\S]*?\])\s*;/i);
  if (!match) return null;
  try {
    const editions = JSON.parse(match[1]);
    const prices = editions.flatMap((edition) => {
      const normal = Array.isArray(edition?.price) ? edition.price[0] : edition?.price?.["0"] ?? edition?.price?.[0];
      if (!normal || typeof edition?.code !== "string") return [];
      const lowest = money(normal.p);
      const average = money(normal.m);
      const highest = money(normal.g);
      if (lowest === null && average === null && highest === null) return [];
      return [{ edition: edition.code, lowest: lowest ?? 0, average: average ?? 0, highest: highest ?? 0 }];
    });
    return { cardName: new URL(location.href).searchParams.get("card") ?? document.title, sourceUrl: location.href, observedAt: new Date().toISOString(), prices };
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === "tcg-metadex:read-liga-quote") respond(readQuote());
});
