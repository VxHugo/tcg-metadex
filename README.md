# TCG MetaDex

Plataforma de inteligência financeira e gestão de portfólio para Pokémon TCG no Brasil. O núcleo do produto é preço de mercado verificável, histórico, oportunidades e valorização — não um catálogo com números inventados.

## Estado atual

- Catálogo de cartas pelo TCGdex, com fallback configurável para a Pokémon TCG API.
- Market Engine testado: mediana, média, menor preço, confiança, tendência, Deal Score e ROI.
- Snapshots auditáveis com fonte, URL, data/hora, condição, idioma, variante e grade.
- A comparação nunca mistura perfis incompatíveis de uma carta.
- API de ingestão: `POST /api/market/observations`.
- API de leitura: `GET /api/market/:productId` com o mesmo perfil da observação.
- Monitor autenticado: `POST /api/market/monitor` avalia oportunidades já auditadas, envia alertas ao Telegram e registra no máximo um snapshot de portfólio por dia.
- Migration Prisma e CI para validar banco, lint, tipos, testes e build.
- Interface sem cartas, preços ou oportunidades de demonstração.
- Radar de Selados com categorias para packs, booster boxes/displays, blisters, ETBs, boxes de coleção, premium collections, tins e decks. Ele só lista ofertas automáticas após configurar uma fonte autorizada; sem isso, abre a busca ao vivo na fonte, sem números inventados.

O scanner só responde quando um serviço OCR real estiver configurado. Sem ele, informa a indisponibilidade; não inventa uma correspondência.

## Rodar o projeto

```bash
npm install
copy .env.example .env
docker compose up --build
```

Depois aplique o banco em outro terminal:

```bash
npm run prisma:migrate:deploy
```

Abra `http://localhost:3000`.

Para desenvolvimento sem Docker, configure um PostgreSQL com a `DATABASE_URL` de `.env` e execute os mesmos comandos. O `Docker Desktop` é necessário nesta máquina para subir a stack completa.

## Registrar uma observação real

Defina `MARKET_INGESTION_TOKEN` em `.env` e envie uma observação somente quando ela vier de uma página/fonte verificável:

```bash
curl -X POST http://localhost:3000/api/market/observations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  --data-binary @observacao-real.json
```

O arquivo deve conter `product.id`, `product.name`, `source`, `sourceUrl`, `price`, `condition`, `language`, `variant` e, quando aplicável, `gradeCompany` e `gradeValue`. Todos os valores devem vir da observação real; não envie placeholders ao ambiente em produção.

Consulte o formato, a pesquisa de fontes e as limitações atuais em [docs/market-sources.md](docs/market-sources.md).

## Fontes de catálogo

O TCGdex continua como padrão e oferece dados multilíngues, incluindo português brasileiro. A Pokémon TCG API pode ser selecionada com `CATALOG_PROVIDER=pokemontcg` ou entra como fallback se o TCGdex estiver indisponível; uma `POKEMON_TCG_API_KEY` é opcional, mas amplia o limite de consultas. Esses provedores identificam cartas, sets e imagens. Preços internacionais não são convertidos nem exibidos como preço de mercado brasileiro.

## Cotação MYP Cards

O detalhe de uma carta consulta a API oficial do MYP Cards somente quando `MYP_CARDS_API_TOKEN` estiver definido no servidor. A resposta é exibida apenas se o nome, o número impresso e a coleção coincidirem; cada cotação preserva o preço mínimo, médio e máximo em BRL, disponibilidade e o link de compra da própria carta. Sem credencial, sem produto ou com uma correspondência ambígua, o site informa a ausência de cotação e não substitui por uma box, acessório ou carta parecida.

## Monitor e alertas

Depois de configurar fontes autorizadas que alimentem `POST /api/market/observations`, defina `MARKET_JOB_TOKEN`, `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Um agendador externo confiável pode chamar o monitor a cada 15 minutos:

```bash
curl -X POST http://localhost:3000/api/market/monitor \
  -H "Authorization: Bearer SEU_MARKET_JOB_TOKEN"
```

Ele nunca procura ou inventa preços: usa apenas snapshots persistidos e comparáveis. Cada oferta é enviada uma vez por URL e preço; o histórico de portfólio só é salvo quando houver preço atual verificável.

## Verificação

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run test
npm run build
```

## Próximos blocos de produto

1. Conector OAuth autorizado do Mercado Livre e fontes brasileiras que permitam integração.
2. Deal Radar de selados com deduplicação, Telegram/Discord e alertas.
3. Persistência de coleção, timeline de portfólio, P/L e ROI por usuário.

## Aviso

Projeto fan-made. Pokémon e Pokémon TCG são marcas de seus respectivos proprietários. Este software não é afiliado nem endossado pela The Pokémon Company, Nintendo, Game Freak ou Creatures.
