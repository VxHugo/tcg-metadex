# Arquitetura do MVP

O desenho anterior previa NestJS desde o primeiro dia. Para validar o produto mais rápido, o MVP usa as Route Handlers do Next.js como BFF. O domínio e o schema continuam separados para permitir extrair uma API NestJS depois sem refazer a UI.

```text
Web / PWA (Next.js)
   |
   +-- /api/catalog ------> TCGdex
   +-- /api/card/:id -----> TCGdex
   +-- /api/scan ----------> FastAPI Scanner
   |                          |
   |                          +-- OpenCV
   |                          +-- Tesseract
   |                          +-- TCGdex resolver
   |
   +-- PostgreSQL/Prisma  [próxima etapa de persistência]
   +-- Redis/BullMQ       [jobs de preço/alertas]
   +-- Telegram Worker    [ofertas]
```

## Princípios

1. Separar catálogo, preços, ofertas e coleção.
2. Todo preço persistido deve possuir fonte, moeda e timestamp.
3. Não usar uma única listagem como verdade de mercado.
4. Affiliate URL deve ser separada da URL original.
5. Scrapers/connectors devem ser substituíveis por APIs/parcerias.
6. Scanner nunca salva automaticamente um match incerto: o usuário confirma.
7. A UI deve funcionar mesmo quando um serviço de inteligência estiver indisponível.
