"use client";
/* eslint-disable @next/next/no-img-element -- card images use dynamic TCGdex URLs and local scanner previews */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { cardImage } from "@/lib/tcgdex";
import type { CardBrief, CardDetail, CollectionEntry, ScanCandidate } from "@/types/tcg";

type View = "home" | "collection" | "catalog" | "scanner" | "market";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function money(value: number) {
  return brl.format(value);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Icon({ name, size = 18 }: { name: "arrow" | "cards" | "chart" | "check" | "cube" | "plus" | "scan" | "search" | "shield"; size?: number }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    cards: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 4V2h10a2 2 0 0 1 2 2v12h-2" /><path d="M8 8h8M8 12h5" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M8 12h8" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 3 7.7 7 10 4-2.3 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo() {
  return <span className="logo"><i>TCG</i><strong>Meta<span>Dex</span></strong></span>;
}

function CardArtwork({ image, name, className = "" }: { image?: string; name: string; className?: string }) {
  const src = cardImage(image, "high");
  if (!src) return <div className={`card-art-placeholder ${className}`}>{initials(name)}</div>;
  return <img className={className} src={src} alt={name} loading="lazy" />;
}

function Header({ active, setActive }: { active: View; setActive: (view: View) => void }) {
  const items: Array<[View, string, Parameters<typeof Icon>[0]["name"]]> = [
    ["home", "Visão geral", "chart"],
    ["collection", "Coleção", "cards"],
    ["catalog", "Catálogo", "search"],
    ["scanner", "Scanner", "scan"],
    ["market", "Mercado", "cube"],
  ];

  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => setActive("home")} aria-label="Ir para a visão geral"><Logo /></button>
      <nav aria-label="Navegação principal">
        {items.map(([view, label, icon]) => (
          <button key={view} className={active === view ? "nav-item active" : "nav-item"} onClick={() => setActive(view)}>
            <Icon name={icon} size={16} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="account-button" aria-label="Conta local"><span>H</span><i>Conta local</i></button>
    </header>
  );
}

function Metric({ label, value, caption, tone = "neutral" }: { label: string; value: string; caption: string; tone?: "neutral" | "accent" }) {
  return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{caption}</small></article>;
}

function HomeView({ collection, setActive }: { collection: CollectionEntry[]; setActive: (view: View) => void }) {
  const totals = useMemo(() => {
    const valued = collection.filter((item) => item.market !== null);
    const costed = collection.filter((item) => item.paid !== null);
    const market = valued.reduce((sum, item) => sum + (item.market ?? 0) * item.quantity, 0);
    const paid = costed.reduce((sum, item) => sum + (item.paid ?? 0) * item.quantity, 0);
    const cards = collection.reduce((sum, item) => sum + item.quantity, 0);
    return { cards, valuedCards: valued.reduce((sum, item) => sum + item.quantity, 0), costedCards: costed.reduce((sum, item) => sum + item.quantity, 0), market, delta: market - paid };
  }, [collection]);

  return (
    <div className="dashboard">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow live"><i /> INTELIGÊNCIA DE MERCADO PARA POKÉMON TCG</span>
          <h1>Entenda o valor da sua coleção.<em> Sem chute.</em></h1>
          <p>Centralize cartas, acompanhe preços verificáveis e encontre oportunidades reais no mercado brasileiro.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => setActive("catalog")}>Explorar catálogo <Icon name="arrow" size={17} /></button>
            <button className="button ghost" onClick={() => setActive("market")}>Como funciona o mercado</button>
          </div>
          <div className="trust-row"><Icon name="shield" size={17} /><span>Preço só aparece com fonte, URL e data da observação.</span></div>
        </div>
        <section className="market-preview" aria-label="Resumo do índice MetaDex">
          <div className="preview-top"><span>ÍNDICE METADEX</span><b>Em formação</b></div>
          <div className="preview-value">—<small>sem histórico suficiente</small></div>
          <div className="chart-area"><div className="chart-gridlines" /><svg viewBox="0 0 420 150" preserveAspectRatio="none" aria-hidden="true"><path d="M0 112 C45 105 52 118 93 95 S145 80 177 92 S231 51 265 74 S330 46 360 55 S397 33 420 40" fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" /><defs><linearGradient id="lineGradient" x1="0" x2="420" y1="0" y2="0"><stop stopColor="#5eead4" stopOpacity=".2" /><stop offset="1" stopColor="#7c8cff" /></linearGradient></defs></svg><span className="chart-note">Adicione uma carta para começar a formar seu histórico.</span></div>
          <div className="preview-footer"><span><i /> Atualização por snapshots</span><span>BRL</span></div>
        </section>
      </section>

      <section className="metrics-grid" aria-label="Resumo do portfólio">
        <Metric label="Cartas na coleção" value={String(totals.cards)} caption={totals.cards ? "registradas localmente" : "comece pelo catálogo"} tone="accent" />
        <Metric label="Valor de mercado" value={totals.valuedCards ? money(totals.market) : "Aguardando"} caption={totals.valuedCards ? `${totals.valuedCards} carta(s) com snapshot` : "nenhuma observação validada"} />
        <Metric label="Resultado da carteira" value={totals.valuedCards && totals.costedCards ? money(totals.delta) : "Não calculado"} caption={totals.costedCards ? "custo registrado parcialmente" : "registre custo e preço"} />
        <Metric label="Radar de oportunidades" value="0 alertas" caption="nenhuma oferta elegível ainda" />
      </section>

      <section className="content-grid">
        <article className="panel portfolio-panel">
          <div className="panel-heading"><div><span className="eyebrow">SUA CARTEIRA</span><h2>Posições acompanhadas</h2></div><button className="text-button" onClick={() => setActive("collection")}>Ver coleção <Icon name="arrow" size={15} /></button></div>
          {collection.length ? (
            <div className="mini-collection">{collection.slice(0, 3).map((item) => <div className="mini-card" key={item.id}><CardArtwork image={item.image} name={item.name} /><div><b>{item.name}</b><span>{item.quantity} unidade(s) · {item.market === null ? "sem preço" : money(item.market)}</span></div></div>)}</div>
          ) : (
            <div className="portfolio-empty"><div className="empty-icon"><Icon name="cards" size={24} /></div><div><strong>Sua coleção começa aqui</strong><p>Busque uma carta no catálogo e adicione-a à sua carteira. Depois, conecte uma observação real de preço.</p></div><button className="button secondary" onClick={() => setActive("catalog")}>Adicionar primeira carta <Icon name="plus" size={16} /></button></div>
          )}
        </article>

        <aside className="panel onboarding-panel">
          <span className="eyebrow">PRÓXIMO PASSO</span><h2>Faça o MetaDex trabalhar para você.</h2>
          <ol className="steps"><li><span>01</span><button onClick={() => setActive("catalog")}>Adicione uma carta pelo catálogo</button></li><li><span>02</span><button onClick={() => setActive("market")}>Registre uma fonte de preço verificável</button></li><li><span>03</span><button onClick={() => setActive("market")}>Acompanhe valor e oportunidades</button></li></ol>
        </aside>
      </section>

      <section className="panel radar-panel">
        <div className="panel-heading"><div><span className="eyebrow">RADAR DO MERCADO</span><h2>Oportunidades verificáveis</h2></div><span className="status-chip"><i /> aguardando fontes</span></div>
        <div className="radar-empty"><div className="radar-icon"><Icon name="scan" size={26} /></div><div><strong>O radar está pronto, mas ainda não recebeu ofertas reais.</strong><p>Quando houver snapshots compatíveis por carta, condição, idioma, variante e grade, o MetaDex calcula desconto, confiança e elegibilidade de alerta.</p></div><button className="button secondary" onClick={() => setActive("market")}>Entender os critérios</button></div>
      </section>
    </div>
  );
}

function CollectionView({ collection, removeItem, setActive }: { collection: CollectionEntry[]; removeItem: (id: string) => void; setActive: (view: View) => void }) {
  const [query, setQuery] = useState("");
  const filtered = collection.filter((item) => `${item.name} ${item.setName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="workspace"><div className="workspace-head"><div><span className="eyebrow">CARTEIRA</span><h1>Minha coleção</h1><p>Organize as posições antes de conectar o monitoramento de preços.</p></div><button className="button primary" onClick={() => setActive("catalog")}>Adicionar carta <Icon name="plus" size={17} /></button></div><div className="toolbar"><label><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar carta, coleção ou número" /></label><span>{collection.length} {collection.length === 1 ? "posição" : "posições"}</span></div>{filtered.length ? <div className="collection-grid">{filtered.map((item) => <article className="collection-item" key={item.id}><CardArtwork image={item.image} name={item.name} /><div className="collection-copy"><span>{item.setName ?? "Coleção não identificada"} · #{item.number ?? "—"}</span><h3>{item.name}</h3><p>{item.condition} · {item.quantity} unidade(s)</p><div className="collection-value"><div><small>Preço de mercado</small><strong>{item.market === null ? "Aguardando" : money(item.market * item.quantity)}</strong></div><button onClick={() => removeItem(item.id)}>Remover</button></div></div></article>)}</div> : <EmptyCollection onCatalog={() => setActive("catalog")} />}</section>;
}

function EmptyCollection({ onCatalog }: { onCatalog: () => void }) {
  return <div className="empty-workspace"><div className="empty-icon"><Icon name="cards" size={30} /></div><h2>Nenhuma carta na coleção</h2><p>Comece pelo catálogo. Você confirma a carta antes de adicioná-la.</p><button className="button primary" onClick={onCatalog}>Abrir catálogo <Icon name="arrow" size={17} /></button></div>;
}

function CatalogView({ addCard }: { addCard: (card: CardDetail) => void }) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (query.trim().length < 2) { setError("Digite ao menos 2 caracteres para buscar."); return; }
    setLoading(true); setError("");
    try { const response = await fetch(`/api/catalog?q=${encodeURIComponent(query.trim())}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Erro ao consultar o catálogo"); setCards(payload.cards ?? []); } catch (error) { setError(error instanceof Error ? error.message : "Erro ao consultar o catálogo"); } finally { setLoading(false); }
  }

  async function add(id: string) {
    setSelected(id);
    try { const response = await fetch(`/api/card/${encodeURIComponent(id)}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Erro ao abrir carta"); addCard(payload.card); } catch (error) { setError(error instanceof Error ? error.message : "Erro ao adicionar carta"); } finally { setSelected(null); }
  }

  return <section className="workspace"><div className="workspace-head"><div><span className="eyebrow">BASE DE CARTAS · TCGDEX</span><h1>Catálogo</h1><p>Encontre a carta certa antes de incluir na sua carteira.</p></div></div><form className="catalog-search" onSubmit={search}><Icon name="search" size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: Pikachu, Charizard, Mew" /><button className="button primary" disabled={loading}>{loading ? "Buscando…" : "Buscar"}<Icon name="arrow" size={17} /></button></form>{error ? <div className="inline-error">{error}</div> : null}{cards.length ? <div className="catalog-grid">{cards.map((card) => <article className="catalog-item" key={card.id}><CardArtwork image={card.image} name={card.name} /><div><span>#{card.localId}</span><h3>{card.name}</h3><small>{card.id}</small></div><button className="add-card" onClick={() => add(card.id)} disabled={selected === card.id}>{selected === card.id ? "Adicionando…" : <><Icon name="plus" size={16} /> Adicionar</>}</button></article>)}</div> : <div className="search-blank"><Icon name="search" size={28} /><h2>Busque a primeira carta</h2><p>O catálogo usa TCGdex para identificar as cartas. Preços não são importados daqui.</p></div>}</section>;
}

function ScannerView({ addCandidate }: { addCandidate: (candidate: ScanCandidate) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [status, setStatus] = useState("Envie uma foto nítida da frente da carta.");
  const [loading, setLoading] = useState(false);
  function pick(next: File | undefined) { if (!next) return; setFile(next); setPreview(URL.createObjectURL(next)); setCandidates([]); setStatus("Imagem pronta para análise."); }
  async function scan() { if (!file) return inputRef.current?.click(); setLoading(true); setStatus("Analisando nome, número e correspondências…"); const data = new FormData(); data.append("file", file); try { const response = await fetch("/api/scan", { method: "POST", body: data }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Falha no scanner"); setCandidates(payload.candidates ?? []); setStatus(`Scanner: ${payload.engine ?? "OCR"}`); } catch (error) { setStatus(error instanceof Error ? error.message : "Falha no scanner"); } finally { setLoading(false); } }
  return <section className="workspace"><div className="workspace-head"><div><span className="eyebrow">IDENTIFICAÇÃO VISUAL</span><h1>Scanner de cartas</h1><p>O resultado sempre precisa da sua confirmação antes de entrar na coleção.</p></div><span className="scanner-status">{status}</span></div><div className="scanner-layout"><button className="upload-zone" onClick={() => inputRef.current?.click()}>{preview ? <img src={preview} alt="Prévia da carta" /> : <><span className="upload-icon"><Icon name="scan" size={30} /></span><strong>Enviar foto da carta</strong><small>JPG, PNG ou WEBP</small></>}</button><input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files?.[0])} /><div className="scanner-side"><span className="eyebrow">ANÁLISE</span><h2>Identifique antes de registrar.</h2><p>O scanner encontra candidatos pelo nome e número. Sem serviço OCR configurado, ele informa a indisponibilidade — não inventa uma carta.</p><button className="button primary" onClick={scan} disabled={loading}>{loading ? "Analisando…" : file ? "Identificar carta" : "Escolher imagem"}<Icon name="arrow" size={17} /></button>{candidates.length ? <div className="candidate-list">{candidates.map((candidate) => <article className="candidate" key={candidate.id}><CardArtwork image={candidate.image} name={candidate.name} /><div><b>{candidate.name}</b><span>{candidate.setName} · #{candidate.number}</span><small>{Math.round(candidate.confidence * 100)}% de confiança</small></div><button onClick={() => addCandidate(candidate)}>Confirmar</button></article>)}</div> : <div className="scanner-checklist"><span><Icon name="check" size={16} /> Corrige perspectiva</span><span><Icon name="check" size={16} /> Lê nome e número</span><span><Icon name="check" size={16} /> Consulta TCGdex</span></div>}</div></div></section>;
}

function MarketView({ setActive }: { setActive: (view: View) => void }) {
  return <section className="workspace"><div className="workspace-head"><div><span className="eyebrow">MERCADO</span><h1>Radar de oportunidades</h1><p>Ofertas só entram no radar quando há uma fonte verificável para comparação.</p></div><span className="status-chip"><i /> sem fontes conectadas</span></div><div className="market-layout"><article className="market-main"><div className="market-empty-icon"><Icon name="chart" size={34} /></div><span className="eyebrow">NENHUMA OFERTA AINDA</span><h2>O radar não usa estimativas inventadas.</h2><p>Para calcular uma oportunidade, o MetaDex precisa comparar uma oferta real com snapshots equivalentes de carta, condição, idioma, variante e grade.</p><button className="button primary" onClick={() => setActive("catalog")}>Adicionar carta à coleção <Icon name="arrow" size={17} /></button></article><aside className="market-rules"><span className="eyebrow">COMO O SCORE FUNCIONA</span><ul><li><Icon name="check" size={17} /><span>Preço da oferta + frete</span></li><li><Icon name="check" size={17} /><span>Mediana e liquidez das observações</span></li><li><Icon name="check" size={17} /><span>Confiança de correspondência e fonte</span></li><li><Icon name="check" size={17} /><span>Alerta só para desconto com confiança</span></li></ul><div><Icon name="shield" size={18} /><p>Dados sem URL, fonte ou data não entram no cálculo.</p></div></aside></div></section>;
}

export function TcgIntelligenceApp() {
  const [active, setActive] = useState<View>("home");
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  useEffect(() => { const saved = localStorage.getItem("tcg-metadex-collection-v2"); if (saved) { try { setCollection(JSON.parse(saved)); } catch { /* dados locais inválidos são ignorados */ } } }, []);
  useEffect(() => { localStorage.setItem("tcg-metadex-collection-v2", JSON.stringify(collection)); }, [collection]);
  function addCard(card: CardDetail) { setCollection((current) => { const existing = current.find((item) => item.cardId === card.id); if (existing) return current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item); return [{ id: crypto.randomUUID(), cardId: card.id, name: card.name, image: card.image, setName: card.set?.name, number: String(card.localId), rarity: card.rarity, quantity: 1, paid: null, market: null, condition: "NM", addedAt: new Date().toISOString() }, ...current]; }); setActive("collection"); }
  function addCandidate(candidate: ScanCandidate) { setCollection((current) => [{ id: crypto.randomUUID(), cardId: candidate.id, name: candidate.name, image: candidate.image, setName: candidate.setName, number: candidate.number, quantity: 1, paid: null, market: null, condition: "NM", addedAt: new Date().toISOString() }, ...current]); setActive("collection"); }
  function removeItem(id: string) { setCollection((current) => current.filter((item) => item.id !== id)); }
  return <main className="app-shell"><Header active={active} setActive={setActive} /><div className="app-content">{active === "home" ? <HomeView collection={collection} setActive={setActive} /> : null}{active === "collection" ? <CollectionView collection={collection} removeItem={removeItem} setActive={setActive} /> : null}{active === "catalog" ? <CatalogView addCard={addCard} /> : null}{active === "scanner" ? <ScannerView addCandidate={addCandidate} /> : null}{active === "market" ? <MarketView setActive={setActive} /> : null}</div><footer><Logo /><span>MetaDex · Inteligência financeira para Pokémon TCG</span><span>Dados verificáveis, sem estimativas fictícias.</span></footer></main>;
}
