# Prompt mestre para o Codex

Você é o agente principal de engenharia deste repositório. Leia primeiro `AGENTS.md`, `START-HERE.md`, `README.md`, `DESIGN-SPEC.md`, `LICENSE-NOTES.md` e a estrutura completa do projeto.

## Objetivo
Transforme este MVP em um produto funcional chamado **TCG Intelligence**, voltado a Pokémon TCG, unindo:
- catálogo de cartas;
- coleção pessoal;
- scanner por imagem;
- preços e histórico;
- oportunidades;
- wishlist;
- alertas;
- dashboard;
- arquitetura preparada para Telegram e produtos selados.

## Design
Use `docs/design/original-reference.png` e `docs/design/generated-tcg-ui-concept.png` como referências visuais. Não copie literalmente o layout da referência; crie um sistema visual original com a mesma direção editorial premium: vinho, creme, tipografia serifada elegante, linhas finas, espaços amplos, cards e gráficos discretos.

O site e o app/mobile responsivo devem parecer partes do mesmo produto.

## Stack principal
- Next.js 15
- React 19
- TypeScript strict
- PostgreSQL
- Prisma
- FastAPI
- OpenCV
- Tesseract OCR
- Redis somente quando houver necessidade clara de jobs/cache
- Docker Compose
- TCGdex como fonte inicial de catálogo

## Funcionalidades

### Dashboard
- valor estimado da coleção;
- quantidade de cartas;
- sets diferentes;
- últimas cartas adicionadas;
- evolução de valor quando houver histórico real;
- oportunidades encontradas;
- estados vazios quando o usuário ainda não tem dados.

### Catálogo
- busca por nome e número;
- filtros por set, raridade e tipo quando suportados;
- imagem e detalhes;
- adicionar à coleção;
- adicionar à wishlist;
- paginação/loading/error states.

### Coleção
Persistência real no PostgreSQL com:
- carta;
- quantidade;
- condição;
- idioma;
- preço pago;
- data de compra;
- observações;
- valor estimado atual quando existir fonte real;
- P/L estimado;
- edição e remoção.

### Scanner
- upload/câmera no mobile;
- detectar/corrigir perspectiva com OpenCV;
- OCR do nome/número;
- buscar candidatos no catálogo;
- score de confiança;
- mostrar candidatos;
- exigir confirmação do usuário antes de salvar;
- estruturar o código para futuro multi-card/binder scan.

### Preços
Criar modelo auditable de observações:
- card id;
- source;
- currency;
- condition;
- variant;
- price;
- observedAt;
- optional marketplace/listing reference.

Nunca apresentar preço demo como se fosse cotação real. Quando não houver dados, mostrar claramente “sem dados”.

### Histórico
- endpoint por carta;
- armazenamento de snapshots;
- gráfico responsivo;
- fonte/moeda/timestamp visíveis.

### Opportunity Score
Implementar como módulo testável. Começar com componentes como:
- desconto vs referência;
- tendência/histórico quando disponível;
- liquidez/proxy quando houver dado;
- confiabilidade/frescura dos dados.

O cálculo deve expor os fatores que formaram o score; não seja uma caixa-preta.

### Wishlist / Alertas
- carta;
- preço alvo;
- prioridade;
- canal futuro de notificação;
- arquitetura para execução periódica.

### Auth
Um dev user é aceitável na primeira vertical slice, mas a arquitetura deve permitir autenticação real depois sem reescrever a camada de domínio.

## Open source
Pesquise no GitHub projetos relevantes para collection tracking, scanner/OCR, TCGdex e price tracking. Use código somente quando a licença permitir e registre tudo em `THIRD_PARTY_NOTICES.md`. Não incorpore código GPL/AGPL em um produto fechado/comercial; nesses casos apenas estude a arquitetura.

## Ordem de execução

### PR 1 — `codex/bootstrap`
Entregue uma base realmente executável:
1. corrigir/organizar o monorepo atual;
2. dependências instaláveis;
3. Next.js rodando;
4. UI base responsiva;
5. catálogo via TCGdex;
6. collection MVP;
7. schema Prisma + PostgreSQL;
8. scanner FastAPI básico;
9. Docker Compose;
10. `.env.example`;
11. lint + typecheck + testes + build;
12. GitHub Actions CI.

Depois faça push e abra PR para `main`.

### Próximos PRs
Depois do bootstrap, continue em branches/PRs separados:
1. `codex/collection-persistence`
2. `codex/price-history`
3. `codex/opportunity-score`
4. `codex/scanner-v2`
5. `codex/wishlist-alerts`
6. `codex/auth`
7. `codex/mobile-polish`
8. `codex/telegram`
9. `codex/sealed-products`

## Commits
Use commits descritivos para trabalho real, por exemplo:
- `feat: bootstrap nextjs web application`
- `feat: add editorial design tokens`
- `feat: integrate tcgdex catalog search`
- `feat: persist collection with prisma`
- `feat: add scanner preprocessing pipeline`
- `test: cover collection service behavior`
- `ci: add github actions pipeline`

Não faça commits vazios, artificiais ou só para inflar o gráfico do GitHub.

## Autonomia
Não me peça confirmação para decisões técnicas pequenas. Tome decisões razoáveis, documente tradeoffs e avance.

Pare apenas se houver:
- custo externo;
- necessidade de chave/credencial privada;
- risco de apagar dados;
- mudança grande de produto;
- ambiguidade de licenciamento;
- uma decisão arquitetural irreversível com alternativas relevantes.

O resultado esperado é um produto funcional e evolutivo, não uma landing page estática.
