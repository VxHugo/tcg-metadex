# Comece aqui

## Teste rápido

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

O catálogo busca dados reais no TCGdex. O scanner usa fallback de demonstração até `SCANNER_URL` estar configurado.

## Scanner real

Em outro terminal:

```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Depois crie `.env.local` em `apps/web`:

```env
SCANNER_URL=http://localhost:8001
TCGDEX_API_URL=https://api.tcgdex.net/v2/en
DATABASE_URL=postgresql://tcg:tcg@localhost:5432/tcg
```

## Tudo junto

```bash
docker compose up --build
```

O Docker Compose prepara o schema Prisma ao iniciar o web app. A coleção usa o usuário de desenvolvimento `collector@tcg-intelligence.local` até a camada de autenticação ser entregue.

## Design

A referência visual enviada está salva em `docs/reference-design.png`. O frontend traduz os elementos principais para um produto TCG: fundo vinho, painéis creme, serifas editoriais, script decorativo, bordas finas e composições de cards em formato de editorial.
