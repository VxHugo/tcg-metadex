const status = document.querySelector("#status");
const button = document.querySelector("#import");
let quote = null;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id || !tab.url?.startsWith("https://www.ligapokemon.com.br/")) return;
  chrome.tabs.sendMessage(tab.id, { type: "tcg-metadex:read-liga-quote" }, (result) => {
    if (chrome.runtime.lastError || !result?.prices?.length) {
      status.textContent = "Esta página não trouxe uma cotação disponível.";
      return;
    }
    quote = result;
    status.textContent = `${result.prices.length} edição(ões) encontradas para ${result.cardName}.`;
    button.disabled = false;
  });
});

button.addEventListener("click", () => {
  if (!quote) return;
  chrome.tabs.query({ url: ["http://localhost:3000/*"] }, (tabs) => {
    if (!tabs.length) {
      status.textContent = "Abra o MetaDex em http://localhost:3000 e mantenha o detalhe da carta aberto.";
      return;
    }
    tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: "tcg-metadex:import-liga-quote", quote }));
    status.textContent = "Cotação enviada. Volte ao MetaDex.";
  });
});
