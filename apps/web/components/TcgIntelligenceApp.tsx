"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { DEMO_COLLECTION, DEMO_OPPORTUNITIES } from "@/lib/demo-data";
import { cardImage } from "@/lib/tcgdex";
import { discountPercent } from "@/lib/opportunity";
import type { CardBrief, CardDetail, CollectionEntry, Opportunity, ScanCandidate } from "@/types/tcg";

type View = "home" | "collection" | "catalog" | "scanner" | "opportunities";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function money(value: number) {
  return brl.format(value || 0);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EditorialMark() {
  return (
    <div className="editorial-mark" aria-label="TCG Intelligence">
      <span className="mark-small">collect what</span>
      <strong>you love</strong>
      <span className="mark-small mark-right">know what it&apos;s worth</span>
    </div>
  );
}

function CardArtwork({ image, name, className = "" }: { image?: string; name: string; className?: string }) {
  const src = cardImage(image, "high");
  if (!src) return <div className={`art-placeholder ${className}`}>{initials(name)}</div>;
  return <img className={className} src={src} alt={name} loading="lazy" />;
}

function ScoreBadge({ score }: { score: number }) {
  return <span className="score-badge">{score}</span>;
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
      <nav>
        {items.map(([view, label]) => (
          <button key={view} className={active === view ? "active" : ""} onClick={() => setActive(view)}>
            {label}
          </button>
        ))}
      </nav>
      <button className="profile-dot" aria-label="Perfil">UI</button>
    </header>
  );
}

function Hero({ collection, onScan }: { collection: CollectionEntry[]; onScan: () => void }) {
  const top = [...collection].sort((a, b) => b.market - a.market).slice(0, 3);

  return (
    <section className="cream-panel hero-panel">
      <div className="date-corner left">08</div>
      <div className="date-corner right">10</div>
      <EditorialMark />
      <div className="hero-grid">
        {top.map((card, index) => (
          <div className={`hero-card frame-${index + 1}`} key={card.id}>
            <CardArtwork image={card.image} name={card.name} />
            <span className="tiny-label">{index === 0 ? "most valuable" : index === 1 ? "recently added" : "favorite pull"}</span>
          </div>
        ))}
      </div>
      <div className="hero-footer">
        <span>your collection, translated into intelligence</span>
        <button onClick={onScan}>scan a card →</button>
      </div>
    </section>
  );
}

function HomeView({ collection, setActive }: { collection: CollectionEntry[]; setActive: (view: View) => void }) {
  const totals = useMemo(() => {
    const market = collection.reduce((sum, item) => sum + item.market * item.quantity, 0);
    const paid = collection.reduce((sum, item) => sum + item.paid * item.quantity, 0);
    const cards = collection.reduce((sum, item) => sum + item.quantity, 0);
    return { market, paid, cards, delta: market - paid };
  }, [collection]);

  return (
    <>
      <Hero collection={collection} onScan={() => setActive("scanner")} />

      <section className="cream-panel dashboard-panel">
        <div className="panel-kicker-row"><span>collection intelligence</span><span>live portfolio</span><span>updated now</span></div>
        <div className="stats-grid">
          <Stat label="valor estimado" value={money(totals.market)} meta={`${totals.cards} cartas registradas`} />
          <Stat label="resultado" value={money(totals.delta)} meta={totals.delta >= 0 ? "acima do custo registrado" : "abaixo do custo registrado"} />
          <Stat label="melhor oportunidade" value={`${DEMO_OPPORTUNITIES[0].score}/100`} meta={`${discountPercent(DEMO_OPPORTUNITIES[0].price, DEMO_OPPORTUNITIES[0].market).toFixed(1)}% abaixo da referência`} />
        </div>
        <div className="dashboard-center">
          <div className="script-title">Your cards tell a story.<br /><em>We read the market.</em></div>
          <p>Catálogo, preço, histórico e oportunidade no mesmo lugar.</p>
        </div>
        <div className="dashboard-nav"><button onClick={() => setActive("collection")}>back to collection</button><span>page <b>1</b> of 4</span><button onClick={() => setActive("opportunities")}>see opportunities</button></div>
      </section>

      <section className="cream-panel opportunities-editorial">
        <div className="section-title"><span>Today&apos;s</span> market notes</div>
        <div className="editorial-opportunity-grid">
          {DEMO_OPPORTUNITIES.slice(0, 3).map((item) => (
            <article key={item.id} className="editorial-opportunity">
              <div className="record-disc" aria-hidden="true" />
              <CardArtwork image={item.image} name={item.title} />
              <ScoreBadge score={item.score} />
              <h3>{item.title}</h3>
              <p>{money(item.price)} agora · referência {money(item.market)}</p>
              <strong>{discountPercent(item.price, item.market).toFixed(1)}% abaixo</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function CollectionView({ collection, removeItem }: { collection: CollectionEntry[]; removeItem: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = collection.filter((item) => `${item.name} ${item.setName ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading">
        <div><span className="eyebrow">your archive</span><h1>Minha <em>coleção</em></h1></div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar na coleção..." />
      </div>
      <div className="collection-grid">
        {filtered.map((item) => {
          const gain = (item.market - item.paid) * item.quantity;
          return (
            <article className="collection-card" key={item.id}>
              <CardArtwork image={item.image} name={item.name} />
              <div className="collection-card-copy">
                <span>{item.setName} · #{item.number}</span>
                <h3>{item.name}</h3>
                <p>{item.rarity ?? "Carta"} · {item.condition} · x{item.quantity}</p>
                <div className="price-pair"><strong>{money(item.market * item.quantity)}</strong><small>{gain >= 0 ? "+" : ""}{money(gain)}</small></div>
                <button className="text-action" onClick={() => removeItem(item.id)}>remover</button>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length ? <div className="empty-state">Nenhuma carta encontrada.</div> : null}
    </section>
  );
}

function CatalogView({ addCard }: { addCard: (card: CardDetail, referencePrice: number) => void }) {
  const [query, setQuery] = useState("Pikachu");
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/catalog?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao consultar catálogo");
      setCards(payload.cards ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao consultar catálogo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void search(); /* initial demo search */ }, []);

  async function add(id: string) {
    setSelected(id);
    try {
      const response = await fetch(`/api/card/${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao abrir carta");
      addCard(payload.card, Number(payload.referencePrice ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar carta");
    } finally {
      setSelected(null);
    }
  }

  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading catalog-heading">
        <div><span className="eyebrow">powered by TCGdex</span><h1>Catálogo <em>global</em></h1></div>
        <form onSubmit={search} className="catalog-search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pikachu, Charizard, Mew..." />
          <button disabled={loading}>{loading ? "buscando..." : "buscar"}</button>
        </form>
      </div>
      {error ? <div className="inline-error">{error}</div> : null}
      <div className="catalog-grid">
        {cards.map((card) => (
          <article className="catalog-card" key={card.id}>
            <CardArtwork image={card.image} name={card.name} />
            <div><span>#{card.localId}</span><h3>{card.name}</h3><small>{card.id}</small></div>
            <button onClick={() => add(card.id)} disabled={selected === card.id}>{selected === card.id ? "..." : "+ coleção"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScannerView({ addCandidate }: { addCandidate: (candidate: ScanCandidate) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [status, setStatus] = useState("Envie uma foto da frente da carta.");
  const [loading, setLoading] = useState(false);

  function pick(next: File | undefined) {
    if (!next) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setCandidates([]);
    setStatus("Imagem pronta para análise.");
  }

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
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Falha no scanner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="cream-panel workspace-panel scanner-workspace">
      <div className="workspace-heading"><div><span className="eyebrow">camera → identify → confirm</span><h1>Scanner <em>inteligente</em></h1></div><span className="scanner-state">{status}</span></div>
      <div className="scanner-layout">
        <button className="drop-zone" onClick={() => inputRef.current?.click()}>
          {preview ? <img src={preview} alt="Prévia da carta" /> : <div><b>+</b><strong>toque para escolher uma foto</strong><span>JPG, PNG ou WEBP</span></div>}
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <div className="scan-results">
          <div className="scan-action-row"><button className="primary-action" onClick={scan} disabled={loading}>{loading ? "analisando..." : file ? "identificar carta" : "escolher imagem"}</button><span>Você confirma antes de salvar.</span></div>
          {candidates.map((candidate, index) => (
            <article className="scan-candidate" key={candidate.id}>
              <CardArtwork image={candidate.image} name={candidate.name} />
              <div><span>{index === 0 ? "melhor correspondência" : "alternativa"}</span><h3>{candidate.name}</h3><p>{candidate.setName} · #{candidate.number}</p><strong>{Math.round(candidate.confidence * 100)}% confiança</strong></div>
              <button onClick={() => addCandidate(candidate)}>confirmar</button>
            </article>
          ))}
          {!candidates.length ? <div className="scanner-explainer"><div>01</div><p>Detecta e corrige perspectiva</p><div>02</div><p>Extrai nome e número por OCR</p><div>03</div><p>Resolve contra o catálogo TCGdex</p></div> : null}
        </div>
      </div>
    </section>
  );
}

function OpportunitiesView({ opportunities }: { opportunities: Opportunity[] }) {
  const [minScore, setMinScore] = useState(70);
  const filtered = opportunities.filter((item) => item.score >= minScore);

  return (
    <section className="cream-panel workspace-panel">
      <div className="workspace-heading">
        <div><span className="eyebrow">market signals</span><h1>Oportunidades <em>agora</em></h1></div>
        <label className="score-filter">score mínimo <strong>{minScore}</strong><input type="range" min="50" max="95" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} /></label>
      </div>
      <div className="opportunity-list">
        {filtered.map((item, index) => (
          <article className="opportunity-row" key={item.id}>
            <span className="opportunity-index">0{index + 1}</span>
            <CardArtwork image={item.image} name={item.title} />
            <div className="opportunity-copy"><span>{item.source}</span><h2>{item.title}</h2><p>{item.subtitle}</p></div>
            <div className="opportunity-money"><small>oferta</small><strong>{money(item.price)}</strong><span>ref. {money(item.market)}</span></div>
            <div className="opportunity-discount"><strong>-{discountPercent(item.price, item.market).toFixed(1)}%</strong><span>vs mercado</span></div>
            <ScoreBadge score={item.score} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function TcgIntelligenceApp() {
  const [active, setActive] = useState<View>("home");
  const [collection, setCollection] = useState<CollectionEntry[]>(DEMO_COLLECTION);

  useEffect(() => {
    const saved = localStorage.getItem("tcg-intelligence-collection");
    if (saved) {
      try { setCollection(JSON.parse(saved)); } catch { /* keep demo */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tcg-intelligence-collection", JSON.stringify(collection));
  }, [collection]);

  function addCard(card: CardDetail, referencePrice: number) {
    setCollection((current) => {
      const existing = current.find((item) => item.cardId === card.id);
      if (existing) return current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [{
        id: crypto.randomUUID(),
        cardId: card.id,
        name: card.name,
        image: card.image,
        setName: card.set?.name,
        number: String(card.localId),
        rarity: card.rarity,
        quantity: 1,
        paid: referencePrice,
        market: referencePrice,
        condition: "NM",
        addedAt: new Date().toISOString(),
      }, ...current];
    });
    setActive("collection");
  }

  function addCandidate(candidate: ScanCandidate) {
    setCollection((current) => [{
      id: crypto.randomUUID(),
      cardId: candidate.id,
      name: candidate.name,
      image: candidate.image,
      setName: candidate.setName,
      number: candidate.number,
      quantity: 1,
      paid: candidate.market ?? 0,
      market: candidate.market ?? 0,
      condition: "NM",
      addedAt: new Date().toISOString(),
    }, ...current]);
    setActive("collection");
  }

  function removeItem(id: string) {
    setCollection((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="app-shell">
      <Header active={active} setActive={setActive} />
      <div className="page-wrap">
        {active === "home" ? <HomeView collection={collection} setActive={setActive} /> : null}
        {active === "collection" ? <CollectionView collection={collection} removeItem={removeItem} /> : null}
        {active === "catalog" ? <CatalogView addCard={addCard} /> : null}
        {active === "scanner" ? <ScannerView addCandidate={addCandidate} /> : null}
        {active === "opportunities" ? <OpportunitiesView opportunities={DEMO_OPPORTUNITIES} /> : null}
      </div>
      <footer className="site-footer"><span>TCG Intelligence</span><span>fan-made data product · not affiliated with The Pokémon Company</span><span>2026</span></footer>
    </main>
  );
}
