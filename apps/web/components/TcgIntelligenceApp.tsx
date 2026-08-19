"use client";
/* eslint-disable @next/next/no-img-element -- TCGdex image URLs are dynamic external assets. */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { cardImage } from "@/lib/tcgdex";
import { sealedCategories, type SealedCategoryId, type SealedOffersResponse } from "@/lib/sealed-products";
import { emptyRecommendations, type RecommendationsResponse } from "@/lib/recommendations";
import type { CardBrief, CardDetail, CollectionEntry, PortfolioSummary, ScanCandidate, TcgSetBrief } from "@/types/tcg";

type View = "home" | "collection" | "catalog" | "scanner" | "opportunities";
type IconName = "grid" | "cards" | "box" | "scan" | "spark" | "bell" | "search" | "plus" | "arrow" | "sliders" | "heart" | "camera" | "chevron" | "more" | "close";

function money(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Icon({ name, size = 18, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    cards: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 8h8M8 12h5M8 16h4" /></>,
    box: <><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><rect x="8" y="8" width="8" height="8" rx="1" /></>,
    spark: <><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="var(--surface)" /><circle cx="15" cy="12" r="2" fill="var(--surface)" /><circle cx="7" cy="18" r="2" fill="var(--surface)" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    camera: <><path d="M4 7h3l1.4-2h7.2L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function CardArtwork({ image, name, className = "" }: { image?: string; name: string; className?: string }) {
  const src = cardImage(image, "high");
  if (!src) return <div className={`art-placeholder ${className}`}>{initials(name)}</div>;
  return <img className={className} src={src} alt={name} loading="lazy" />;
}

const navigation: Array<{ view: View; label: string; icon: IconName }> = [
  { view: "opportunities", label: "Oportunidades", icon: "spark" },
  { view: "home", label: "Resumo", icon: "grid" },
  { view: "catalog", label: "Catálogo", icon: "cards" },
  { view: "collection", label: "Minha coleção", icon: "box" },
  { view: "scanner", label: "Scanner", icon: "scan" },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-orb"><i /><i /></span><span>TCG <b>MetaDex</b></span></div>;
}

function Header({ setActive }: { setActive: (view: View) => void }) {
  return <header className="topbar">
    <button className="brand-button" onClick={() => setActive("opportunities")} aria-label="Ir para oportunidades de compra"><Brand /></button>
    <button className="global-search" onClick={() => setActive("opportunities")} aria-label="Abrir recomendações de compra"><Icon name="search" size={17} /><span>Veja recomendações e preços abaixo da referência...</span><kbd>/</kbd></button>
    <div className="topbar-actions"><button className="icon-button" aria-label="Notificações"><Icon name="bell" size={19} /></button><button className="avatar" aria-label="Perfil do usuário">VH</button></div>
  </header>;
}

function Sidebar({ active, setActive }: { active: View; setActive: (view: View) => void }) {
  return <aside className="sidebar"><nav aria-label="Navegação principal">{navigation.map((item) => <button key={item.view} className={active === item.view ? "is-active" : ""} onClick={() => setActive(item.view)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><Icon name="spark" size={16} /></span><strong>Comece pelas oportunidades</strong><p>Compare ofertas, referência e sinais de alta observada.</p><button onClick={() => setActive("opportunities")}>Ver recomendações <Icon name="arrow" size={14} /></button></div><small>MetaDex · compre com dados</small></div></aside>;
}

function MobileNav({ active, setActive }: { active: View; setActive: (view: View) => void }) {
  return <nav className="mobile-nav" aria-label="Navegação mobile">{navigation.slice(0, 5).map((item) => <button key={item.view} className={active === item.view ? "is-active" : ""} onClick={() => setActive(item.view)}><Icon name={item.icon} size={18} /><span>{item.label.replace("Minha ", "")}</span></button>)}</nav>;
}

function Metric({ label, value, description, icon, tone = "blue" }: { label: string; value: string; description: string; icon: IconName; tone?: "blue" | "green" | "orange" | "slate" }) {
  return <article className={`metric-card tone-${tone}`}><div className="metric-top"><span>{label}</span><i><Icon name={icon} size={17} /></i></div><strong>{value}</strong><small>{description}</small></article>;
}

function HomeView({ collection, summary, collectionError, setActive }: { collection: CollectionEntry[]; summary: PortfolioSummary; collectionError: string; setActive: (view: View) => void }) {
  const totals = useMemo(() => {
    const cards = collection.reduce((sum, item) => sum + item.quantity, 0);
    const sets = new Set(collection.map((item) => item.setName).filter(Boolean)).size;
    return { cards, sets };
  }, [collection]);
  const highlights = collection.slice(0, 3);

  return <>
    <section className="page-heading dashboard-heading"><div><span className="eyebrow">SEU ESPAÇO DE COLEÇÃO</span><h1>Olá, <em>Hugo.</em></h1><p>Uma visão objetiva do seu acervo e dos próximos passos.</p></div><button className="primary-button" onClick={() => setActive("scanner")}><Icon name="scan" />Escanear carta</button></section>
    <section className="metric-grid">
      <Metric label="Valor cotado" value={summary.quotedPositions ? money(summary.currentValue) : "Sem dados"} description={summary.quotedPositions ? "apenas cotações verificáveis" : "aguardando fonte de preço"} icon="spark" />
      <Metric label="Cartas na coleção" value={String(totals.cards)} description={`${totals.sets} sets diferentes`} icon="cards" tone="green" />
      <Metric label="Resultado P/L" value={summary.profitLoss === null ? "Sem base" : money(summary.profitLoss)} description={summary.comparablePositions ? `${summary.comparablePositions} posição(ões) comparável(is)` : "registre custo e aguarde cotação"} icon="spark" tone="orange" />
      <Metric label="Investido" value={summary.costedPositions ? money(summary.invested) : "Não informado"} description={summary.costedPositions ? "com base no que você pagou" : "registre o custo ao adicionar"} icon="bell" tone="slate" />
    </section>
    <section className="dashboard-columns">
      <article className="content-card collection-preview"><div className="section-head"><div><span className="eyebrow">COLEÇÃO</span><h2>Adicionadas recentemente</h2></div><button className="link-button" onClick={() => setActive("collection")}>Ver coleção <Icon name="arrow" size={15} /></button></div>
        {highlights.length ? <div className="recent-cards">{highlights.map((card) => <article key={card.id} className="recent-card"><CardArtwork image={card.image} name={card.name} /><div><b>{card.name}</b><span>{card.setName ?? "Set não informado"}</span><strong>{card.market === null ? "Aguardando snapshot" : money(card.market)}</strong></div></article>)}</div> : <EmptyInline icon="cards" title="Sua coleção está vazia" copy="Comece buscando uma carta do seu acervo no catálogo." action="Abrir catálogo" onAction={() => setActive("catalog")} />}
      </article>
      <article className="content-card activity-card"><div className="section-head"><div><span className="eyebrow">ATIVIDADE</span><h2>Seu próximo passo</h2></div><span className="status-dot">Ao vivo</span></div><div className="activity-empty"><span className="activity-ring"><Icon name="scan" size={24} /></span><h3>Registre sua primeira carta</h3><p>Use a busca para localizar uma carta pelo nome, número ou set. Você confirma todos os dados antes de salvar.</p><button className="secondary-button" onClick={() => setActive("catalog")}>Buscar no catálogo <Icon name="arrow" size={16} /></button></div></article>
    </section>
    <section className="market-strip"><div className="market-symbol"><Icon name="spark" size={22} /></div><div><span className="eyebrow">MERCADO</span><h2>Dados de mercado, quando forem verificáveis.</h2></div><p>O MetaDex não inventa preço, disponibilidade ou oportunidade. Quando uma fonte confiável estiver conectada, ela aparecerá aqui com origem e data.</p></section>
    {collectionError ? <div className="notice notice-warning">{collectionError}</div> : null}
  </>;
}

function EmptyInline({ icon, title, copy, action, onAction }: { icon: IconName; title: string; copy: string; action: string; onAction: () => void }) {
  return <div className="empty-inline"><span className="empty-icon"><Icon name={icon} size={22} /></span><div><strong>{title}</strong><p>{copy}</p><button onClick={onAction}>{action} <Icon name="arrow" size={14} /></button></div></div>;
}

type CollectionDraft = { quantity: number; paid: number | null; condition: CollectionEntry["condition"]; purchaseDate: string | null; language: string | null; notes: string | null };

function AddToCollectionDialog({ card, saving, onClose, onSave }: { card: CardDetail; saving: boolean; onClose: () => void; onSave: (draft: CollectionDraft) => Promise<void> }) {
  const [quantity, setQuantity] = useState(1);
  const [paid, setPaid] = useState("");
  const [condition, setCondition] = useState<CollectionEntry["condition"]>("NM");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [language, setLanguage] = useState("Português");
  const [notes, setNotes] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsedPaid = paid.trim() ? Number(paid.replace(",", ".")) : null;
    if (parsedPaid !== null && (!Number.isFinite(parsedPaid) || parsedPaid < 0)) return;
    await onSave({ quantity, paid: parsedPaid, condition, purchaseDate: purchaseDate || null, language: language || null, notes: notes.trim() || null });
  }

  return <div className="dialog-backdrop" role="presentation"><section className="collection-dialog" role="dialog" aria-modal="true" aria-labelledby="collection-dialog-title"><button className="dialog-close" onClick={onClose} disabled={saving} aria-label="Fechar"><Icon name="close" /></button><div className="dialog-card"><CardArtwork image={card.image} name={card.name} /><div><span className="eyebrow">ADICIONAR AO ACERVO</span><h2 id="collection-dialog-title">{card.name}</h2><p>{card.set?.name ?? "Set não informado"} · #{card.localId}</p></div></div><form className="collection-form" onSubmit={(event) => void submit(event)}><label>Quantidade<input type="number" min="1" max="10000" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label><label>Condição<select value={condition} onChange={(event) => setCondition(event.target.value as CollectionEntry["condition"])}><option value="NM">NM · Near Mint</option><option value="LP">LP · Levemente jogada</option><option value="MP">MP · Moderadamente jogada</option><option value="HP">HP · Muito jogada</option><option value="DAMAGED">Danificada</option></select></label><label>Preço pago por unidade (R$)<input type="number" min="0" step="0.01" inputMode="decimal" value={paid} onChange={(event) => setPaid(event.target.value)} placeholder="Opcional" /></label><label>Data da compra<input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label><label>Idioma<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="Português">Português</option><option value="Inglês">Inglês</option><option value="Japonês">Japonês</option><option value="">Não informado</option></select></label><label className="form-span">Anotações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: comprada em evento, trocada, lote…" rows={2} /></label><p className="form-note">O valor atual só aparecerá quando houver uma cotação verificável do mesmo perfil da carta.</p><div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar na coleção"}</button></div></form></section></div>;
}

function CollectionView({ collection, summary, collectionError, loading, removeItem, setActive }: { collection: CollectionEntry[]; summary: PortfolioSummary; collectionError: string; loading: boolean; removeItem: (id: string) => Promise<void>; setActive: (view: View) => void }) {
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const filtered = collection.filter((item) => `${item.name} ${item.setName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  async function remove(id: string) { setRemoving(id); await removeItem(id); setRemoving(null); }
  return <>
    <section className="page-heading"><div><span className="eyebrow">SEU ACERVO</span><h1>Minha <em>coleção</em></h1><p>Organize as cartas que já fazem parte da sua história.</p></div><button className="primary-button" onClick={() => setActive("catalog")}><Icon name="plus" />Adicionar carta</button></section>
    <section className="portfolio-strip"><Metric label="Quanto você pagou" value={summary.costedPositions ? money(summary.invested) : "Não informado"} description={`${summary.costedPositions} posição(ões) com custo`} icon="cards" /><Metric label="Valor atual cotado" value={summary.quotedPositions ? money(summary.currentValue) : "Sem cotação"} description="somente preços verificáveis" icon="spark" tone="green" /><Metric label="Lucro / prejuízo" value={summary.profitLoss === null ? "Sem base" : money(summary.profitLoss)} description={summary.profitLoss === null ? "falta custo ou cotação" : `${summary.roiPercent ?? 0}% de retorno comparável`} icon="spark" tone={summary.profitLoss !== null && summary.profitLoss < 0 ? "orange" : "blue"} /></section>
    <section className="workspace-card"><div className="collection-toolbar"><div className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por carta ou set..." aria-label="Buscar na coleção" /></div><button className="filter-button"><Icon name="sliders" size={17} />Filtros</button><span className="result-count">{filtered.length} {filtered.length === 1 ? "item" : "itens"}</span></div>
      {collectionError ? <div className="notice notice-warning">{collectionError}</div> : null}
      {filtered.length ? <div className="collection-table">{filtered.map((item) => <article className="collection-row" key={item.id}><CardArtwork image={item.image} name={item.name} /><div className="card-identity"><strong>{item.name}</strong><span>{item.setName ?? "Set não informado"} · #{item.number ?? "—"}</span></div><div><span className="column-label">PAGO</span><b>{item.paid === null ? "—" : money(item.paid)}</b></div><div><span className="column-label">MERCADO</span><b>{item.market === null ? "Sem cotação" : money(item.market)}</b></div><div><span className="column-label">RESULTADO</span><b className={item.profitLoss !== null && item.profitLoss < 0 ? "loss-value" : "gain-value"}>{item.profitLoss === null ? "—" : money(item.profitLoss)}</b></div><div><span className="column-label">QTD.</span><b>×{item.quantity}</b></div><button className="row-menu" aria-label={`Remover ${item.name} da coleção`} onClick={() => void remove(item.id)} disabled={removing === item.id}>{removing === item.id ? <Icon name="close" /> : <Icon name="more" />}</button></article>)}</div> : <div className="large-empty"><span className="empty-icon"><Icon name="box" size={28} /></span><h2>{loading ? "Carregando sua coleção..." : query ? "Nenhuma carta encontrada" : "Sua coleção ainda começa aqui"}</h2><p>{query ? "Tente outro nome ou limpe a busca." : "Pesquise uma carta no catálogo ou use o scanner para começar seu acervo."}</p>{!query ? <button className="primary-button" onClick={() => setActive("catalog")}><Icon name="search" />Explorar catálogo</button> : null}</div>}
    </section>
  </>;
}

function CatalogView({ addCard, initialQuery }: { addCard: (cardId: string) => Promise<void>; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const fetchCatalog = useCallback(async (term: string) => { if (term.trim().length < 2) return; setLoading(true); setError(""); try { const response = await fetch(`/api/catalog?q=${encodeURIComponent(term.trim())}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Erro ao consultar catálogo"); setCards(payload.cards ?? []); } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao consultar catálogo"); } finally { setLoading(false); } }, []);
  function search(event?: FormEvent) { event?.preventDefault(); return fetchCatalog(query); }
  useEffect(() => { setQuery(initialQuery); void fetchCatalog(initialQuery); }, [fetchCatalog, initialQuery]);
  async function add(id: string) { setSelected(id); setError(""); try { await addCard(id); } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao adicionar carta"); } finally { setSelected(null); } }
  return <>
    <section className="catalog-hero"><span className="eyebrow">CATÁLOGO TCGDEX</span><h1>Encontre a carta <em>certa.</em></h1><p>Pesquise por nome, número ou coleção e adicione ao seu acervo quando quiser.</p><form onSubmit={search} className="catalog-search"><Icon name="search" size={21} /><label className="visually-hidden" htmlFor="catalog-search">Buscar carta no catálogo</label><input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: Pikachu, Charizard ou 025" /><button type="submit" disabled={loading}>{loading ? "Buscando..." : "Buscar"}</button></form><div className="search-suggestions"><span>Buscas populares</span>{["Pikachu", "Charizard", "Mewtwo", "Gardevoir"].map((term) => <button key={term} type="button" onClick={() => { setQuery(term); void fetchCatalog(term); }}>{term}</button>)}</div></section>
    <section className="catalog-layout"><aside className="filter-rail"><div className="filter-heading"><h2>Filtros</h2><button>Limpar</button></div><FilterGroup title="Coleção" values={["Todas as coleções", "Scarlet & Violet", "Crown Zenith"]} /><FilterGroup title="Raridade" values={["Qualquer raridade", "Rare", "Illustration Rare"]} /><FilterGroup title="Tipo" values={["Todos os tipos", "Elétrico", "Fogo", "Água"]} /></aside><div className="catalog-results"><div className="result-toolbar"><span>{loading ? "Buscando cartas..." : `${cards.length} resultados para “${query}”`}</span><button className="filter-mobile"><Icon name="sliders" size={16} />Filtros</button><button className="sort-button">Mais relevantes <Icon name="chevron" size={15} /></button></div>{error ? <div className="notice notice-warning">{error}</div> : null}<div className="catalog-grid">{cards.map((card) => <article className="product-card" key={card.id}><button className="wishlist-button" aria-label={`Adicionar ${card.name} à wishlist`}><Icon name="heart" size={17} /></button><CardArtwork image={card.image} name={card.name} /><div className="product-copy"><span>#{card.localId}</span><h3>{card.name}</h3><p>{card.id}</p></div><button className="add-button" onClick={() => void add(card.id)} disabled={selected === card.id}>{selected === card.id ? "Adicionando..." : <><Icon name="plus" size={15} />Coleção</>}</button></article>)}</div>{!loading && !cards.length && !error ? <div className="large-empty"><span className="empty-icon"><Icon name="search" size={28} /></span><h2>Nenhuma carta encontrada</h2><p>Tente pesquisar pelo nome em inglês, número ou outro set.</p></div> : null}</div></section>
  </>;
}

function FilterGroup({ title, values }: { title: string; values: string[] }) { return <section className="filter-group"><h3>{title}<Icon name="chevron" size={14} /></h3>{values.map((value, index) => <label key={value}><input type="checkbox" defaultChecked={index === 0} /><span>{value}</span></label>)}</section>; }

function ScannerView({ addCandidate }: { addCandidate: (candidate: ScanCandidate) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null); const [preview, setPreview] = useState<string | null>(null); const [file, setFile] = useState<File | null>(null); const [candidates, setCandidates] = useState<ScanCandidate[]>([]); const [status, setStatus] = useState("Envie uma foto da frente da carta."); const [loading, setLoading] = useState(false); const [confirming, setConfirming] = useState<string | null>(null);
  function pick(next: File | undefined) { if (!next) return; if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(URL.createObjectURL(next)); setCandidates([]); setStatus("Imagem pronta para análise."); }
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function scan() { if (!file) return inputRef.current?.click(); setLoading(true); setStatus("Lendo imagem, OCR e correspondências..."); const data = new FormData(); data.append("file", file); try { const response = await fetch("/api/scan", { method: "POST", body: data }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Falha no scanner"); setCandidates(payload.candidates ?? []); setStatus(`Scanner: ${payload.engine ?? "OCR"}`); } catch (reason) { setStatus(reason instanceof Error ? reason.message : "Falha no scanner"); } finally { setLoading(false); } }
  async function confirm(candidate: ScanCandidate) { setConfirming(candidate.id); try { await addCandidate(candidate); setStatus("Carta confirmada e adicionada à coleção."); } catch (reason) { setStatus(reason instanceof Error ? reason.message : "Não foi possível salvar a carta."); } finally { setConfirming(null); } }
  return <><section className="page-heading"><div><span className="eyebrow">IDENTIFICAÇÃO DE CARTAS</span><h1>Scanner <em>inteligente</em></h1><p>Envie uma foto, revise os candidatos e confirme antes de adicionar.</p></div><span className="scanner-status"><i />{status}</span></section><section className="scanner-layout"><button className={`upload-zone ${preview ? "has-preview" : ""}`} onClick={() => inputRef.current?.click()} aria-label="Escolher foto da carta">{preview ? <img src={preview} alt="Prévia da carta enviada" /> : <div><span className="upload-icon"><Icon name="camera" size={28} /></span><h2>Envie uma foto da carta</h2><p>Arraste uma imagem ou toque para escolher.</p><small>JPG, PNG ou WEBP · máximo 10 MB</small></div>}</button><input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files?.[0])} /><div className="scanner-side"><article className="scan-guide"><span className="eyebrow">ANTES DE ESCANEAR</span><h2>Uma foto nítida faz diferença.</h2><ul><li><b>01</b> Posicione a carta sobre uma superfície lisa.</li><li><b>02</b> Evite reflexos e sombras fortes.</li><li><b>03</b> Mantenha nome e número visíveis.</li></ul></article><button className="primary-button scan-button" onClick={() => void scan()} disabled={loading}><Icon name="scan" />{loading ? "Identificando..." : file ? "Identificar carta" : "Escolher imagem"}</button>{candidates.length ? <div className="candidate-list"><div className="section-head"><div><span className="eyebrow">RESULTADOS</span><h2>Confirme a correspondência</h2></div></div>{candidates.map((candidate, index) => <article className="candidate-card" key={candidate.id}><CardArtwork image={candidate.image} name={candidate.name} /><div><span>{index === 0 ? "MELHOR CORRESPONDÊNCIA" : "ALTERNATIVA"}</span><h3>{candidate.name}</h3><p>{candidate.setName} · #{candidate.number}</p><strong>{Math.round(candidate.confidence * 100)}% de confiança</strong></div><button onClick={() => void confirm(candidate)} disabled={confirming === candidate.id}>{confirming === candidate.id ? "Salvando..." : "Confirmar"}</button></article>)}</div> : null}</div></section></>;
}

function SetArtwork({ set }: { set: TcgSetBrief }) {
  const src = set.logo ? cardImage(set.logo, "low") : undefined;
  return src ? <img src={src} alt={`Logo de ${set.name}`} loading="lazy" /> : <span>{initials(set.name)}</span>;
}

function SealedOffersView({ initialSets, onExploreSet }: { initialSets: TcgSetBrief[]; onExploreSet: (setName: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<SealedCategoryId>("booster-box");
  const [radar, setRadar] = useState<SealedOffersResponse>({ status: "source_not_configured", offers: [], categories: sealedCategories, message: "O radar automático precisa de uma fonte autorizada. Enquanto isso, abra a busca atualizada da categoria diretamente na loja.", observedAt: null });
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse>(emptyRecommendations);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [sets, setSets] = useState<TcgSetBrief[]>(initialSets);
  const [setsQuery, setSetsQuery] = useState("Mega");
  const [setsError, setSetsError] = useState("");

  const loadOffers = useCallback(async (category: SealedCategoryId) => {
    setLoadingOffers(true);
    try {
      const response = await fetch(`/api/sealed/offers?category=${encodeURIComponent(category)}`);
      const payload = await response.json() as SealedOffersResponse & { error?: string };
      if (!response.ok && !payload.status) throw new Error(payload.error ?? "Não foi possível consultar o radar.");
      setRadar(payload);
    } catch (reason) {
      setRadar({ status: "source_unavailable", offers: [], categories: sealedCategories, message: reason instanceof Error ? reason.message : "Não foi possível consultar o radar.", observedAt: null });
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    try {
      const response = await fetch("/api/recommendations");
      const payload = await response.json() as RecommendationsResponse & { error?: string };
      if (!response.ok && payload.status !== "storage_unavailable") throw new Error(payload.error ?? "Não foi possível calcular as recomendações.");
      setRecommendations(payload);
    } catch (reason) {
      setRecommendations({ ...emptyRecommendations, status: "storage_unavailable", message: reason instanceof Error ? reason.message : "Não foi possível calcular as recomendações." });
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const loadSets = useCallback(async (term: string) => {
    setSetsError("");
    try {
      const response = await fetch(`/api/sets?q=${encodeURIComponent(term)}`);
      const payload = await response.json() as { sets?: TcgSetBrief[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível consultar as coleções.");
      setSets(payload.sets ?? []);
    } catch (reason) {
      setSetsError(reason instanceof Error ? reason.message : "Não foi possível consultar as coleções.");
    }
  }, []);

  useEffect(() => { void loadOffers(selectedCategory); }, [loadOffers, selectedCategory]);
  useEffect(() => { void loadRecommendations(); }, [loadRecommendations]);
  useEffect(() => { if (!initialSets.length) void loadSets("Mega"); }, [initialSets.length, loadSets]);

  const categories = radar.categories;
  const activeCategory = categories.find((category) => category.id === selectedCategory) ?? null;
  const offers = radar.offers;
  const observed = radar.observedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(radar.observedAt)) : null;
  const recommendationsObserved = recommendations.observedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(recommendations.observedAt)) : null;

  function chooseCategory(category: SealedCategoryId) {
    setSelectedCategory(category);
  }

  function searchSets(event: FormEvent) {
    event.preventDefault();
    void loadSets(setsQuery);
  }

  function scrollToCollections() {
    document.getElementById("sets-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToRecommendations() {
    document.getElementById("buy-recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <>
    <section className="sealed-hero">
      <div className="sealed-hero-copy"><span className="sealed-kicker"><i />RECOMENDAÇÕES DE COMPRA · POKÉMON TCG</span><h1>Veja o que está <em>abaixo da referência.</em></h1><p>O MetaDex prioriza ofertas que possam ser comparadas com o mesmo card, condição, idioma, variante e grade. Depois, você explora packs, boxes e coleções.</p><div className="sealed-hero-actions"><button className="hero-primary" type="button" onClick={scrollToRecommendations}>Ver melhores achados <Icon name="arrow" size={17} /></button><button className="hero-secondary" type="button" onClick={scrollToCollections}>Explorar coleções <Icon name="arrow" size={17} /></button></div><div className="sealed-trust"><span><Icon name="search" size={16} />Fonte e link</span><span><Icon name="spark" size={16} />Referência equivalente</span><span><Icon name="cards" size={16} />Sinais observados</span></div></div>
      <div className="sealed-visual" aria-hidden="true"><span className="sealed-orbit orbit-one" /><span className="sealed-orbit orbit-two" /><span className="sealed-orbit orbit-three" /><span className="sealed-sweep" /><div className="sealed-pack-visual"><small>TCG METADEX</small><b>BUY<br />SMART</b><span>PREÇO · PROVA</span></div><div className="sealed-visual-label"><i />MONITORANDO MERCADO</div></div>
    </section>

    <section className="recommendations-section" id="buy-recommendations">
      <div className="section-head recommendations-head"><div><span className="eyebrow">PRIMEIRO: OPORTUNIDADES REAIS</span><h2>Achados abaixo da referência</h2><p>Uma oferta entra aqui somente após comparação com pelo menos três observações atuais e equivalentes.</p></div><button className="refresh-button" type="button" onClick={() => void loadRecommendations()} disabled={loadingRecommendations}><Icon name="spark" size={15} />{loadingRecommendations ? "Atualizando…" : "Atualizar sinais"}</button></div>
      {loadingRecommendations ? <div className="recommendations-loading"><span /><span /><span /></div> : recommendations.deals.length ? <div className="recommendation-grid">{recommendations.deals.map((deal) => <article className="recommendation-card" key={deal.id}><div className="recommendation-art">{deal.imageUrl ? <CardArtwork image={deal.imageUrl} name={deal.productName} /> : <span><Icon name={deal.productType === "CARD" ? "cards" : "box"} size={28} /></span>}<b>−{deal.discountPercent}%</b></div><div className="recommendation-copy"><span>{deal.source}{deal.seller ? ` · ${deal.seller}` : ""}</span><h3>{deal.productName}</h3>{deal.localNumber ? <p>#{deal.localNumber} · Score {deal.dealScore}/100</p> : <p>Score {deal.dealScore}/100</p>}<div className="recommendation-prices"><strong>{money(deal.offerPrice)}</strong><small>referência {money(deal.referencePrice)}</small></div><dl><div><dt>Economia</dt><dd>{money(deal.savings)}</dd></div><div><dt>Base</dt><dd>{deal.referenceListings} observações</dd></div></dl><p className="recommendation-proof">Referência: {deal.referenceSources.join(" · ")}</p></div><a className="buy-button" href={deal.sourceUrl} target="_blank" rel="noreferrer">Ver oferta <Icon name="arrow" size={15} /></a></article>)}</div> : <div className="recommendations-empty"><span className="opportunity-orbit"><Icon name="spark" size={27} /></span><div><span className="eyebrow">AGUARDANDO DADOS COMPARÁVEIS</span><h3>Ainda não há uma pechincha verificada.</h3><p>{recommendations.message}</p><small>Para entrar no ranking, a oferta precisa ter fonte, URL, preço e três referências equivalentes. Isso impede que o app chame qualquer anúncio de promoção.</small></div></div>}
      <p className="recommendations-disclaimer">{recommendationsObserved ? `Dados mais recentes: ${recommendationsObserved}. ` : ""}Cobertura atual: {recommendations.coverage.observations} observações, {recommendations.coverage.products} produtos e {recommendations.coverage.sources} fontes.</p>
    </section>

    <section className="value-signals-section">
      <div className="section-head"><div><span className="eyebrow">CARTAS EM OBSERVAÇÃO</span><h2>Sinais de alta observada</h2><p>Movimento de preço registrado nos últimos 30 dias. Não é promessa nem previsão de valorização.</p></div><span className="signal-pill"><Icon name="spark" size={14} />dados, não palpite</span></div>
      {loadingRecommendations ? <div className="signal-loading"><span /><span /><span /></div> : recommendations.valueSignals.length ? <div className="signal-grid">{recommendations.valueSignals.map((signal) => <article className="signal-card" key={signal.id}>{signal.imageUrl ? <CardArtwork image={signal.imageUrl} name={signal.productName} /> : <span className="signal-placeholder"><Icon name="cards" size={23} /></span>}<div><span>+{signal.changePercent}% em {signal.windowDays} dias</span><h3>{signal.productName}</h3><p>De {money(signal.baselinePrice)} para {money(signal.currentPrice)} · {signal.sourceCount} fontes</p></div><b>{signal.score}<small>/100</small></b></article>)}</div> : <div className="signals-empty"><Icon name="cards" size={22} /><p>Quando houver histórico recente de pelo menos duas fontes, as cartas com alta observada aparecerão aqui — sempre como sinal, nunca como garantia.</p></div>}
    </section>

    <section className="sealed-category-grid" aria-label="Categorias de produtos selados">
      {categories.map((category, index) => <article className={selectedCategory === category.id ? "sealed-category is-selected" : "sealed-category"} key={category.id} style={{ "--category-index": index } as CSSProperties}><button type="button" aria-pressed={selectedCategory === category.id} onClick={() => chooseCategory(category.id)}><span className="sealed-category-icon"><Icon name={category.id === "pack" || category.id === "blister" ? "cards" : "box"} size={21} /></span><strong>{category.label}</strong><p>{category.description}</p></button><a href={category.sourceUrl} target="_blank" rel="noreferrer">Abrir busca <Icon name="arrow" size={14} /></a></article>)}
    </section>

    <section className="sealed-radar-section">
      <div className="section-head"><div><span className="eyebrow">OFERTAS DE PRODUTOS SELADOS</span><h2>{activeCategory?.label ?? "Radar de ofertas"}</h2></div><span className={radar.status === "ok" ? "source-state is-live" : "source-state"}><i />{radar.status === "ok" ? "Fonte conectada" : "Fonte aguardando"}</span></div>
      {loadingOffers ? <div className="sealed-empty"><span className="opportunity-orbit"><Icon name="search" size={27} /></span><h3>Consultando a fonte…</h3></div> : offers.length ? <div className="sealed-offer-grid">{offers.map((offer) => <article className="sealed-offer" key={offer.id}>{offer.thumbnail ? <img src={offer.thumbnail} alt="" loading="lazy" /> : <div className="sealed-offer-art"><Icon name="box" size={30} /></div>}<div className="sealed-offer-copy"><span>{offer.source}{offer.seller ? ` · ${offer.seller}` : ""}</span><h3>{offer.title}</h3>{offer.originalPrice ? <p><s>{money(offer.originalPrice)}</s> <b>{offer.discountPercent}% OFF</b></p> : <p>Preço verificado, sem desconto anterior informado.</p>}<strong>{money(offer.price)}</strong>{offer.freeShipping ? <small>Frete grátis informado pela fonte</small> : null}</div><a className="buy-button" href={offer.sourceUrl} target="_blank" rel="noreferrer">Ver oferta <Icon name="arrow" size={15} /></a></article>)}</div> : <div className="sealed-empty"><span className="opportunity-orbit"><Icon name="spark" size={27} /></span><span className="eyebrow">RADAR AUTOMÁTICO</span><h3>{radar.status === "source_not_configured" ? "Conecte uma fonte para listar promoções aqui." : "Não há ofertas verificadas para mostrar agora."}</h3><p>{radar.message}</p>{activeCategory ? <a className="primary-button" href={activeCategory.sourceUrl} target="_blank" rel="noreferrer">Ver ofertas de {activeCategory.label}<Icon name="arrow" size={16} /></a> : null}</div>}
      <p className="radar-disclaimer">{observed ? `Última consulta: ${observed}. ` : ""}Confirme idioma, lacre, conteúdo e condições de venda na página da loja antes de comprar.</p>
    </section>

    <section className="sets-section" id="sets-directory"><div className="section-head"><div><span className="eyebrow">COLEÇÕES POKÉMON TCG</span><h2>Explore a coleção por expansão</h2><p>Dados do catálogo TCGdex. Busque o nome da coleção para ver seus cards depois.</p></div><span className="sets-count">{sets.length} coleções</span></div><form className="sets-search" onSubmit={searchSets}><Icon name="search" size={17} /><label className="visually-hidden" htmlFor="sets-search">Buscar coleção</label><input id="sets-search" value={setsQuery} onChange={(event) => setSetsQuery(event.target.value)} placeholder="Ex.: Mega, Journey, Destined…" /><button type="submit">Buscar</button></form>{setsError ? <div className="notice notice-warning">{setsError}</div> : null}<div className="sets-grid">{sets.map((set) => <button className="set-tile" key={set.id} onClick={() => onExploreSet(set.name)}><span className="set-logo"><SetArtwork set={set} /></span><span><b>{set.name}</b><small>{set.cardCount?.official ?? set.cardCount?.total ?? "—"} cards</small></span><Icon name="arrow" size={15} /></button>)}</div>{!setsError && !sets.length ? <div className="sets-empty">Nenhuma coleção encontrada. Tente outro nome.</div> : null}</section>
  </>;
}

export function TcgIntelligenceApp({ initialSets = [] }: { initialSets?: TcgSetBrief[] }) {
  const [active, setActive] = useState<View>("opportunities");
  const [catalogQuery, setCatalogQuery] = useState("Pikachu");
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({ totalCards: 0, invested: 0, currentValue: 0, profitLoss: null, roiPercent: null, costedPositions: 0, quotedPositions: 0, comparablePositions: 0 });
  const [collectionError, setCollectionError] = useState("");
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardDetail | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  useEffect(() => {
    async function loadCollection() {
      try {
        const response = await fetch("/api/collection");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Não foi possível abrir sua coleção.");
        setCollection(payload.items ?? []);
        setSummary(payload.summary ?? { totalCards: 0, invested: 0, currentValue: 0, profitLoss: null, roiPercent: null, costedPositions: 0, quotedPositions: 0, comparablePositions: 0 });
        setCollectionError("");
      } catch {
        setCollectionError("A coleção não pôde ser carregada do banco local. Tente atualizar a página.");
      } finally {
        setCollectionLoading(false);
      }
    }
    void loadCollection();
  }, []);

  async function addCard(cardId: string) {
    const response = await fetch(`/api/card/${encodeURIComponent(cardId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Não foi possível localizar a carta.");
    const card = payload.card as CardDetail | undefined;
    if (!card?.id) throw new Error("O catálogo não retornou uma carta válida.");
    setSelectedCard(card);
  }

  async function saveCard(draft: CollectionDraft) {
    if (!selectedCard) return;
    setSavingCard(true);
    try {
      const response = await fetch("/api/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        card: { id: selectedCard.id, name: selectedCard.name, image: selectedCard.image, localNumber: String(selectedCard.localId), rarity: selectedCard.rarity, set: selectedCard.set ? { id: selectedCard.set.id, name: selectedCard.set.name, logo: selectedCard.set.logo, symbol: selectedCard.set.symbol } : undefined },
        ...draft,
      }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível salvar esta carta.");
      setCollection(payload.items ?? []);
      setSummary(payload.summary ?? summary);
      setSelectedCard(null);
      setCollectionError("");
      setActive("collection");
    } catch {
      setCollectionError("Não foi possível salvar no banco local. Verifique se o PostgreSQL do MetaDex está em execução.");
    } finally {
      setSavingCard(false);
    }
  }

  async function removeItem(id: string) {
    const response = await fetch(`/api/collection/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Não foi possível remover este item.");
    setCollection((current) => current.filter((item) => item.id !== id));
  }
  function exploreSet(setName: string) { setCatalogQuery(setName); setActive("catalog"); }
  return <main className="app-shell"><Header setActive={setActive} /><div className="app-frame"><Sidebar active={active} setActive={setActive} /><div className="page-content">{active === "home" ? <HomeView collection={collection} summary={summary} collectionError={collectionError} setActive={setActive} /> : null}{active === "collection" ? <CollectionView collection={collection} summary={summary} collectionError={collectionError} loading={collectionLoading} removeItem={removeItem} setActive={setActive} /> : null}{active === "catalog" ? <CatalogView addCard={addCard} initialQuery={catalogQuery} /> : null}{active === "scanner" ? <ScannerView addCandidate={(candidate) => addCard(candidate.id)} /> : null}{active === "opportunities" ? <SealedOffersView initialSets={initialSets} onExploreSet={exploreSet} /> : null}</div></div><MobileNav active={active} setActive={setActive} />{selectedCard ? <AddToCollectionDialog card={selectedCard} saving={savingCard} onClose={() => setSelectedCard(null)} onSave={saveCard} /> : null}</main>;
}

