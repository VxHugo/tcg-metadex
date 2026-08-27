chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "tcg-metadex:import-liga-quote" || !message.quote) return;
  document.documentElement.dataset.tcgMetadexLigaQuote = JSON.stringify(message.quote);
  window.dispatchEvent(new Event("tcg-metadex:liga-import"));
});
