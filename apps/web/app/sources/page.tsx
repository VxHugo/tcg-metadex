export const dynamic = "force-dynamic";

function status(enabled: boolean) {
  return enabled ? "Ativo" : "Não configurado";
}

export default function SourcesPage() {
  const telegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
  const discord = Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DEAL_RADAR_INTERNAL_TOKEN);
  const telegramAlerts = Boolean(process.env.DEAL_ALERT_TELEGRAM_CHAT_IDS);
  const discordAlerts = Boolean(process.env.DEAL_ALERT_DISCORD_WEBHOOK_URL);
  const channels = (process.env.DISCORD_DEAL_CHANNEL_IDS ?? "").split(",").map((v) => v.trim()).filter(Boolean);

  const rows = [
    { name: "Telegram ingest", detail: "Grupos/canais onde o bot foi adicionado e autorizado", enabled: telegram },
    { name: "Discord ingest", detail: channels.length ? `${channels.length} canal(is) explicitamente selecionado(s)` : "Canais autorizados; configure IDs para restringir", enabled: discord },
    { name: "Alertas Telegram", detail: "Notificações de oportunidades acima do score mínimo", enabled: telegramAlerts },
    { name: "Alertas Discord", detail: "Webhook de saída para oportunidades", enabled: discordAlerts },
  ];

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ margin: 0, color: "#2563eb", fontWeight: 700, letterSpacing: ".08em", fontSize: 12 }}>METADEX</p>
        <h1 style={{ margin: "8px 0", fontSize: 42, letterSpacing: "-.04em" }}>Fontes do radar</h1>
        <p style={{ margin: 0, color: "#667085" }}>Somente integrações configuradas e autorizadas são monitoradas.</p>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        {rows.map((row) => (
          <article key={row.name} style={{ display: "flex", justifyContent: "space-between", gap: 24, border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, background: "#fff" }}>
            <div><strong>{row.name}</strong><div style={{ color: "#667085", marginTop: 6 }}>{row.detail}</div></div>
            <span style={{ whiteSpace: "nowrap", fontWeight: 700, color: row.enabled ? "#15803d" : "#98a2b3" }}>{status(row.enabled)}</span>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 28, borderRadius: 18, padding: 24, background: "#f8fafc" }}>
        <h2 style={{ marginTop: 0 }}>Baseline Liga Pokémon</h2>
        <p style={{ color: "#667085", marginBottom: 0 }}>O radar compara automaticamente com snapshots cuja fonte esteja identificada como Liga Pokémon. A coleta desses snapshots deve vir de integração autorizada/importação permitida; o projeto não assume uma API oficial nem faz scraping não verificado.</p>
      </section>
    </main>
  );
}
