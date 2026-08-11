"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { cardImage } from "@/lib/tcgdex";
import type { CardBrief, CollectionEntry, PriceReference, ScanCandidate } from "@/types/tcg";

type View = "home" | "collection" | "catalog" | "scanner" | "opportunities";

function money(value: number, currency = "EUR") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function referenceLabel(reference?: PriceReference) {
  if (!reference) return "Sem preço de referência";
  return `${money(reference.amount, reference.currency)} · ${reference.source}`;
}

function CardArtwork({ image, name, className = "" }: { image?: string; name: string; className?: string }) {
  const src = cardImage(image, "high");
  if (!src) return <div className={`art-placeholder ${className}`}>{initials(name)}</div>;
  return <img className={className} src={src} alt={name} loading="lazy" />;
}

function Stat({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </article>
  );
}

function Header({ active, setActive }: { active: View; setActive: (view: View) => void }) {
  const items: Array<[View, string]> = [
    ["collection", "coleção"],
    ["catalog", "catálogo"],
    ["scanner", "scanner"],
    ["opportunities", "oportunidades"],
  ];

  return (
    <header className="site-header">
      <button className="wordmark" onClick={() => setActive("home")} aria-label="Ir para início">
        <span>TCG</span>
        <strong>Intelligence</strong>
      </button>
      <nav aria-label="Navegação principal">
        {items.map(([view, label]) => (
          <button key={view} className={active === view ? "active" : ""} onClick={() => setActive(view)}>
            {label}
          </button>
        ))}
      </nav>
      <button className="profile-dot" aria-label="Usuário de desenvolvimento">DV</button>
    </header>
  );
}

function Hero({ collection, onScan }: { collection: CollectionEntry[]; onScan: () => void }) {
  const top = [...collection]
    .filter((item) => item.reference)
    .sort((a, b) => (b.reference?.amount ?? 0) - (a.reference?.amount ?? 0))
    .slice(0, 3);

  return (
    <section className="cream-panel hero-panel">
      <div className="date-corner left">ARQUIVO</div>
      <div className="date-corner right">2026</div>
      <div className="editorial-mark" aria-label="TCG Intelligence">
        <span className="mark-small">sua coleção,</span>
        <strong>sua inteligência</strong>
        <span className="mark-small mark-right">dados para colecionar melhor</span>
      </div>
      {top.length ? (
        <div className="hero-grid">
          {top.map((card, index) => (
            <div className={`hero-card frame-${index + 1}`} key={card.id}>
              <CardArtwork image={card.image} name={card.name} />
              <span className="tiny-label">{index === 0 ? "maior referência" : index === 1 ? "no arquivo" : "edição especial"}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="hero-empty">
          <span>01</span>
          <p>Seu arquivo começa com uma carta.</p>
          <span>TCG Intelligence</span>
        </div>
      )}
      <div className="hero-footer">
        <span>Catálogo, coleção e scanner em um único arquivo.</span>
        <button onClick={onScan}>escanear uma carta →</button>
      </div>
    </section>
  );
}

function HomeView({ collection, collectionError, setActive }: { collection: CollectionEntry[]; collectionError: string; setActive: (view: View) => void }) {
  const totals = useMemo(() => {
    const cards = collection.reduce((sum, item) => sum + item.quantity, 0);
    const sets = new Set(collection.map((item) => item.setName).filter(Boolean)).size;
    const references = new Map<string, number>();
    collection.forEach((item) => {
      if (!item.reference) return;
      references.set(item.reference.currency, (references.get(item.reference.currency) ?? 0) + item.reference.amount * item.quantity);
    });
    return { cards, sets, references };
  }, [collection]);
  const firstReference = [...totals.references.entries()][0];

  return (
    <>
      <Hero collection={collection} onScan={() => setActive("scanner")} />
      <section className="cream-panel dashboard-panel">
        <div className="panel-kicker-row"><span>arquivo pessoal</span><span>vertical slice</span><span>fontes auditáveis</span></div>
        <div className="stats-grid">
          <Stat
            label="valor de referência"
            value={firstReference ? money(firstReference[1], firstReference[0]) : "sem dados"}
            meta={firstReference ? "TCGdex / Cardmarket; não é cotação local" : "adicione cartas com preço disponível"}
          />
          <Stat label="cartas no arquivo" value={String(totals.cards)} meta={`${totals.sets} sets diferentes`} />
          <Stat label="oportunidades" value="sem dados" meta="nenhuma fonte de ofertas conectada" />
        </div>
        <div className="dashboard-center">
          <div className="script-title">Colecione com calma.<br /><em>Decida com contexto.</em></div>
          <p>Use o catálogo TCGdex para criar seu arquivo e confirme toda leitura do scanner.</p>
          {collectionError ? <p className="inline-message">{collectionError}</p> : null}
        </div>
        <div className="dashboard-nav"><button onClick={() => setActive("catalog")}>explorar catálogo</button><span>base <b>1</b> de 1</span><button onClick={() => setActive("collection")}>abrir coleção</button></div>
      </section>
    </>
  );
}

function CollectionView({ collection, collectionError, loading, removeItem }: { collection: CollectionEntry[]; collectionError: string; loading: boolean; removeItem: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const filtered = collection.filter((item) => `${item.name} ${item.setName ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  async function remove(id: string) {
    setRemoving(id);
    await removeItem(id);
    setRemoving(null);
  }

  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading">
        <div><span className="eyebrow">arquivo PostgreSQL · usuário de desenvolvimento</span><h1>Minha <em>coleção</em></h1></div>
        <label className="input-label">Buscar na coleção<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="nome ou set..." /></label>
      </div>
      {collectionError ? <div className="inline-error">{collectionError}</div> : null}
      <div className="collection-grid">
        {filtered.map((item) => (
          <article className="collection-card" key={item.id}>
            <CardArtwork image={item.image} name={item.name} />
            <div className="collection-card-copy">
              <span>{item.setName ?? "Set não informado"} · #{item.number ?? "—"}</span>
              <h3>{item.name}</h3>
              <p>{item.rarity ?? "Carta"} · {item.condition} · x{item.quantity}</p>
              <div className="price-pair"><strong>{referenceLabel(item.reference)}</strong><small>{item.paidPrice ? `Pago: ${money(item.paidPrice, item.paidCurrency)}` : "Preço pago não informado"}</small></div>
              <button className="text-action" onClick={() => void remove(item.id)} disabled={removing === item.id}>{removing === item.id ? "removendo..." : "remover"}</button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? <div className="empty-state">{loading ? "Carregando o arquivo..." : "Sua coleção ainda está vazia. Abra o catálogo para adicionar a primeira carta."}</div> : null}
    </section>
  );
}

function CatalogView({ addCard }: { addCard: (cardId: string) => Promise<void> }) {
  const [query, setQuery] = useState("Pikachu");
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (term: string) => {
    if (term.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/catalog?q=${encodeURIComponent(term.trim())}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao consultar catálogo");
      setCards(payload.cards ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erro ao consultar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  function search(event?: FormEvent) {
    event?.preventDefault();
    return fetchCatalog(query);
  }

  useEffect(() => { void fetchCatalog("Pikachu"); }, [fetchCatalog]);

  async function add(id: string) {
    setSelected(id);
    setError("");
    try {
      await addCard(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erro ao adicionar carta");
    } finally {
      setSelected(null);
    }
  }

  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading catalog-heading">
        <div><span className="eyebrow">catálogo público · TCGdex</span><h1>Catálogo <em>global</em></h1></div>
        <form onSubmit={search} className="catalog-search">
          <label className="visually-hidden" htmlFor="catalog-search">Buscar carta</label>
          <input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pikachu, Charizard, Mew..." />
          <button disabled={loading}>{loading ? "buscando..." : "buscar"}</button>
        </form>
      </div>
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="catalog-grid">
        {cards.map((card) => (
          <article className="catalog-card" key={card.id}>
            <CardArtwork image={card.image} name={card.name} />
            <div><span>#{card.localId}</span><h3>{card.name}</h3><small>{card.id}</small></div>
            <button onClick={() => void add(card.id)} disabled={selected === card.id}>{selected === card.id ? "adicionando..." : "+ coleção"}</button>
          </article>
        ))}
      </div>
      {!loading && !cards.length && !error ? <div className="empty-state">Nenhuma carta encontrada para esta busca.</div> : null}
    </section>
  );
}

function ScannerView({ addCandidate }: { addCandidate: (candidate: ScanCandidate) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [status, setStatus] = useState("Envie uma foto da frente da carta.");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  function pick(next: File | undefined) {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setCandidates([]);
    setStatus("Imagem pronta para análise.");
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function scan() {
    if (!file) return inputRef.current?.click();
    setLoading(true);
    setStatus("Lendo imagem, OCR e correspondências...");
    const data = new FormData();
    data.append("file", file);
    try {
      const response = await fetch("/api/scan", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha no scanner");
      setCandidates(payload.candidates ?? []);
      setStatus(payload.engine === "demo-fallback" ? "Modo demonstração: ligue o serviço Python para OCR real." : `Scanner: ${payload.engine ?? "OCR"}`);
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Falha no scanner");
    } finally {
      setLoading(false);
    }
  }

  async function confirm(candidate: ScanCandidate) {
    setConfirming(candidate.id);
    try {
      await addCandidate(candidate);
      setStatus("Carta confirmada e adicionada à coleção.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Não foi possível salvar a carta.");
    } finally {
      setConfirming(null);
    }
  }

  return (
    <section className="cream-panel workspace-panel scanner-workspace">
      <div className="workspace-heading"><div><span className="eyebrow">câmera → identificar → confirmar</span><h1>Scanner <em>inteligente</em></h1></div><span className="scanner-state">{status}</span></div>
      <div className="scanner-layout">
        <button className="drop-zone" onClick={() => inputRef.current?.click()} aria-label="Escolher foto da carta">
          {preview ? <img src={preview} alt="Prévia da carta" /> : <div><b>+</b><strong>toque para escolher uma foto</strong><span>JPG, PNG ou WEBP</span></div>}
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files?.[0])} />
        <div className="scan-results">
          <div className="scan-action-row"><button className="primary-action" onClick={() => void scan()} disabled={loading}>{loading ? "analisando..." : file ? "identificar carta" : "escolher imagem"}</button><span>Você confirma antes de salvar.</span></div>
          {candidates.map((candidate, index) => (
            <article className="scan-candidate" key={candidate.id}>
              <CardArtwork image={candidate.image} name={candidate.name} />
              <div><span>{index === 0 ? "melhor correspondência" : "alternativa"}</span><h3>{candidate.name}</h3><p>{candidate.setName} · #{candidate.number}</p><strong>{Math.round(candidate.confidence * 100)}% confiança</strong></div>
              <button onClick={() => void confirm(candidate)} disabled={confirming === candidate.id}>{confirming === candidate.id ? "salvando..." : "confirmar"}</button>
            </article>
          ))}
          {!candidates.length ? <div className="scanner-explainer"><div>01</div><p>Detecta e corrige perspectiva</p><div>02</div><p>Extrai nome e número por OCR</p><div>03</div><p>Resolve contra o catálogo TCGdex</p></div> : null}
        </div>
      </div>
    </section>
  );
}

function OpportunitiesView() {
  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading"><div><span className="eyebrow">sinais de mercado</span><h1>Oportunidades <em>agora</em></h1></div></div>
      <div className="empty-state">
        <p>Nenhuma oferta verificada ainda.</p>
        <p>Esta base não simula preços ou disponibilidade: oportunidades só aparecerão quando uma fonte auditável estiver conectada.</p>
      </div>
    </section>
  );
}

export function TcgIntelligenceApp() {
  const [active, setActive] = useState<View>("home");
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [collectionError, setCollectionError] = useState("");
  const [collectionLoading, setCollectionLoading] = useState(true);

  async function loadCollection() {
    setCollectionLoading(true);
    try {
      const response = await fetch("/api/collection", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar a coleção.");
      setCollection(payload.items ?? []);
      setCollectionError("");
    } catch (reason) {
      setCollectionError(reason instanceof Error ? reason.message : "Não foi possível carregar a coleção.");
      setCollection([]);
    } finally {
      setCollectionLoading(false);
    }
  }

  useEffect(() => { void loadCollection(); }, []);

  async function addCard(cardId: string) {
    const response = await fetch("/api/collection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardId, condition: "NM" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Não foi possível adicionar a carta.");
    setCollection((current) => {
      const currentItem = current.find((item) => item.id === payload.item.id);
      return currentItem ? current.map((item) => item.id === payload.item.id ? payload.item : item) : [payload.item, ...current];
    });
    setCollectionError("");
    setActive("collection");
  }

  async function removeItem(id: string) {
    const response = await fetch(`/api/collection?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json();
      setCollectionError(payload.error ?? "Não foi possível remover a carta.");
      return;
    }
    setCollection((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="app-shell">
      <Header active={active} setActive={setActive} />
      <div className="page-wrap">
        {active === "home" ? <HomeView collection={collection} collectionError={collectionError} setActive={setActive} /> : null}
        {active === "collection" ? <CollectionView collection={collection} collectionError={collectionError} loading={collectionLoading} removeItem={removeItem} /> : null}
        {active === "catalog" ? <CatalogView addCard={addCard} /> : null}
        {active === "scanner" ? <ScannerView addCandidate={(candidate) => addCard(candidate.id)} /> : null}
        {active === "opportunities" ? <OpportunitiesView /> : null}
      </div>
      <footer className="site-footer"><span>TCG Intelligence</span><span>fan-made data product · not affiliated with The Pokémon Company</span><span>2026</span></footer>
    </main>
  );
}
