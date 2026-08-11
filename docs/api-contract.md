# API Contract inicial

## GET /cards
Retorna catálogo paginado.

## GET /cards/:id/prices
Retorna snapshots e agregações.

## GET /collection
Retorna coleção do usuário e valor estimado.

## POST /collection/items
Adiciona carta ou produto selado.

Body:

```json
{
  "productId": "id",
  "quantity": 2,
  "purchasePrice": 620,
  "condition": "NM",
  "language": "pt-BR"
}
```

## GET /market/opportunities
Filtros:
- type
- set
- minDiscount
- minScore
- maxPrice
