# Modelo de dados

Entidades principais:

- User
- Card
- Set
- Product
- SealedProduct
- CollectionItem
- Binder
- MasterSet
- PriceSource
- PriceSnapshot
- PriceAggregate
- Offer
- TelegramChannel
- TelegramMessage
- Opportunity
- Alert
- AffiliateProgram
- AffiliateLink
- AffiliateClick
- AffiliateConversion
- ScannerJob
- ScannerResult
- PortfolioSnapshot

## Regra de preço
`PriceSnapshot` guarda o valor observado; `PriceAggregate` guarda estatísticas calculadas por janela temporal.
