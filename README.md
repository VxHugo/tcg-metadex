# TCG Intelligence — MVP

Plataforma para Pokémon TCG que junta **coleção, catálogo, scanner, preços e oportunidades** em uma experiência única.

O projeto deixou de ser apenas documentação: agora contém um frontend funcional em Next.js e um serviço de scanner em FastAPI/OpenCV/Tesseract.

## O que já existe neste MVP

- Dashboard editorial responsivo inspirado na referência vinho/creme fornecida
- Coleção persistida em PostgreSQL com um usuário de desenvolvimento explícito
- Busca real de cartas via TCGdex
- Inclusão de cartas do catálogo na coleção
- Página de oportunidades e Opportunity Score
- Upload de imagem no scanner
- Serviço Python com correção de perspectiva + OCR + resolução via TCGdex
- Confirmação manual do resultado antes de adicionar à coleção
- Prisma schema ampliado para catálogo, coleção, wishlist, preços, ofertas, alertas e sessões de scan
- Preços de referência armazenados com fonte, moeda e timestamp; nenhuma oferta simulada é exibida como dado real
- Docker Compose para web + scanner + PostgreSQL + Redis

## Stack do MVP

```text
Browser
  │
  ▼
Next.js 15 / React 19
  ├── catálogo → TCGdex REST API
  ├── coleção → API + PostgreSQL (dev user configurável)
  └── scanner proxy
          │
          ▼
FastAPI + OpenCV + Tesseract
  └── resolução → TCGdex REST API

PostgreSQL + Prisma: schema preparado para persistência da próxima etapa
Redis: preparado para jobs/preços/alertas
```

## Rodar somente o frontend

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Sem `SCANNER_URL`, o scanner entra em modo demonstração. Catálogo e detalhes continuam consultando TCGdex. Para persistir a coleção em desenvolvimento local, suba o PostgreSQL do Compose ou configure `DATABASE_URL`.

## Rodar tudo com Docker

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- Scanner API: `http://localhost:8001`
- Scanner health: `http://localhost:8001/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Estrutura

```text
apps/web/                  interface Next.js + BFF/API routes
packages/database/         schema Prisma
services/ai/               scanner OpenCV/Tesseract/FastAPI
services/price-engine/     próximo módulo de coleta/agregação de preços
services/telegram-worker/  próximo módulo de monitoramento
packages/core/             regras de negócio compartilháveis
```

## Próximas entregas de produto

1. Persistir usuários/coleção no PostgreSQL e trocar localStorage por API.
2. Sincronizar catálogo TCGdex para banco local.
3. Registrar snapshots de preços e gráfico histórico.
4. Implementar importação de ofertas reais por connectors permitidos.
5. Calibrar Opportunity Score com liquidez/histórico real.
6. Scanner multi-carta e página de fichário.
7. Alertas e Telegram.
8. Autenticação, wishlist, master sets e produtos selados.

## Verificação

```bash
npm ci
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run test
npm run build
```

## Aviso

Projeto fan-made. Pokémon e Pokémon TCG são marcas de seus respectivos proprietários. Este software não é afiliado nem endossado pela The Pokémon Company, Nintendo, Game Freak ou Creatures.
