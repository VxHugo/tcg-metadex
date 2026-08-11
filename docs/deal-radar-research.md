# MetaDex Deal Radar

## Objetivo

Monitorar fontes autorizadas de promoções de Pokémon TCG, interpretar mensagens, resolver a carta correta, comparar a oferta com referências de mercado armazenadas e alertar o usuário quando houver desconto relevante.

## Arquitetura implementada

```text
Telegram Bot API webhook ─┐
                          ├─> normalized RawDealEvent
Discord connector worker ─┘
                                  │
                                  ▼
                           Deal message parser
                                  │
                                  ▼
                         TCGdex / local resolver
                                  │
                                  ▼
                    Liga baseline from PriceSnapshot
                                  │
                                  ▼
                          Deal score + dedupe
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
                Offer DB                 notifications
                                     Telegram / Discord
```

## Telegram

O webhook aceita updates oficiais do Telegram Bot API e usa `message`, `channel_post`, `edited_message` ou `edited_channel_post` quando houver texto/caption.

O endpoint exige `TELEGRAM_WEBHOOK_SECRET` e valida o header oficial `X-Telegram-Bot-Api-Secret-Token`.

O bot não tenta entrar sozinho em grupos. Ele processa apenas chats onde foi legitimamente adicionado/autorizado.

Documentação oficial:
- https://core.telegram.org/bots/api

### Registrar webhook

Depois de publicar o app em HTTPS:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'content-type: application/json' \
  -d '{
    "url":"https://SEU_DOMINIO/api/deal-radar/telegram",
    "secret_token":"SEU_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates":["message","edited_message","channel_post","edited_channel_post"]
  }'
```

## Discord

O worker usa Discord Gateway por `discord.js` e encaminha `MESSAGE_CREATE` para o endpoint interno do MetaDex.

É necessário habilitar o privileged intent `MESSAGE_CONTENT` no Developer Portal quando aplicável. O worker pode ser limitado aos canais presentes em `DISCORD_DEAL_CHANNEL_IDS`.

Documentação oficial:
- https://docs.discord.com/developers/events/gateway
- https://docs.discord.com/developers/resources/message

Rodar com Docker:

```bash
docker compose --profile deal-radar up --build
```

## Baseline Liga Pokémon

A engine reconhece snapshots com fontes:

- `LigaPokemon`
- `Liga Pokemon`
- `Liga Pokémon`
- `LigaPokemon BR`

Esses snapshots são lidos de `PriceSnapshot` e usados para menor preço e mediana.

Não foi implementado scraping automático da Liga Pokémon porque este projeto não deve assumir que existe API pública/oficial ou que scraping é permitido. Use uma integração autorizada/feed permitido ou importe snapshots pelo endpoint protegido:

```http
POST /api/deal-radar/baseline
Authorization: Bearer $DEAL_RADAR_INTERNAL_TOKEN
Content-Type: application/json
```

Exemplo:

```json
{
  "productId": "sv03.5-199",
  "source": "Liga Pokémon",
  "price": 285,
  "condition": "NM",
  "language": "PT-BR",
  "sourceUrl": "https://fonte-autorizada.example/listing/123"
}
```

## Parser

O parser atual extrai:

- preço em BRL (`R$ 190`, `R$ 190,00`, etc.)
- número de coleção (`215/197`)
- condição (`NM`, `LP`, `MP`, `HP`, `DMG` e nomes em inglês)
- provável nome da carta
- confidence inicial

Mensagens com baixa confiança não viram oportunidade automaticamente e retornam `NEEDS_REVIEW`.

## Matching

1. tenta resolver em `Product` no banco;
2. usa TCGdex como fallback;
3. dá peso adicional ao número local da carta;
4. persiste/atualiza a carta resolvida no catálogo local.

## Deduplicação

Antes de criar um `Offer`, o sistema busca outra oferta recente da mesma carta, fonte, preço e URL em uma janela de 6 horas.

Existe também `dealFingerprint()` para permitir evolução futura para dedupe multi-source por texto/imagem/seller.

## Deal Score

Score inicial 0-100:

- 55% desconto em relação ao baseline
- 30% confiança do match
- 15% confiabilidade da fonte

A confiabilidade da fonte começa neutra quando não há histórico. Nenhum score de reputação é inventado.

## Alertas

Quando o desconto é de pelo menos 10%, o deal é classificado como oportunidade. Notificação só é enviada quando o score atinge `DEAL_ALERT_MIN_SCORE` (default: 70).

Saídas atuais:

- Telegram via `sendMessage`
- Discord via webhook

## Segurança

- segredos nunca ficam hardcoded;
- endpoints de ingest interno/baseline usam Bearer token;
- Telegram valida webhook secret;
- nenhuma integração tenta burlar permissões de grupos/canais;
- nenhum preço demo é apresentado como oferta real;
- ausência de baseline é mostrada como tal.

## Próximas melhorias

- fila BullMQ/Redis para grande volume;
- tabela própria de `DealSource` e métricas de confiabilidade;
- dedupe perceptual por image hash;
- parser de produto selado;
- regras de alerta por usuário/wishlist;
- importador oficial/autorizado de baseline brasileiro;
- painel de revisão para deals com baixa confiança.
