import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function DealsPage() {
  const deals = await prisma.offer.findMany({
    orderBy: [{ opportunityScore: "desc" }, { detectedAt: "desc" }],
    take: 60,
    include: { product: true },
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "end", marginBottom: 32 }}>
        <div>
          <p style={{ margin: 0, color: "#2563eb", fontWeight: 700, letterSpacing: ".08em", fontSize: 12 }}>METADEX</p>
          <h1 style={{ margin: "8px 0", fontSize: 42, letterSpacing: "-.04em" }}>Radar de ofertas</h1>
          <p style={{ margin: 0, color: "#667085" }}>Promoções detectadas em fontes autorizadas e comparadas com referências salvas no MetaDex.</p>
        </div>
        <a href="/" style={{ color: "#111827", textDecoration: "none", fontWeight: 600 }}>← Dashboard</a>
      </header>

      {deals.length === 0 ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 20, padding: 40, background: "#fafafa" }}>
          <h2 style={{ marginTop: 0 }}>Nenhuma oferta real registrada ainda</h2>
          <p style={{ color: "#667085", marginBottom: 0 }}>Conecte Telegram/Discord e carregue snapshots de referência. O sistema não mostra promoções fictícias como dados reais.</p>
        </section>
      ) : (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {deals.map((deal) => {
            const price = Number(deal.price);
            const reference = deal.referencePrice ? Number(deal.referencePrice) : undefined;
            const discount = reference ? ((reference - price) / reference) * 100 : undefined;
            return (
              <article key={deal.id} style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, background: "white" }}>
                {deal.product.imageUrl ? <img src={deal.product.imageUrl} alt={deal.product.name} style={{ width: "100%", aspectRatio: "3/2", objectFit: "contain", marginBottom: 16 }} /> : null}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18 }}>{deal.product.name}</h2>
                    <p style={{ margin: "4px 0 0", color: "#667085", fontSize: 13 }}>{deal.source}</p>
                  </div>
                  <strong style={{ color: "#2563eb" }}>{deal.opportunityScore ?? "—"}</strong>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{brl(price)}</div>
                  {reference ? <div style={{ color: "#667085", marginTop: 5 }}>Referência: {brl(reference)}</div> : <div style={{ color: "#98a2b3", marginTop: 5 }}>Sem referência de mercado</div>}
                  {discount !== undefined ? <div style={{ marginTop: 8, color: discount > 0 ? "#15803d" : "#b42318", fontWeight: 700 }}>{discount.toFixed(1)}% abaixo da referência</div> : null}
                </div>
                {deal.originalUrl ? <a href={deal.originalUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 18, color: "#2563eb", fontWeight: 700 }}>Abrir oferta →</a> : null}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
