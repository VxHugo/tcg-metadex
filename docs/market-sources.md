# Fontes de mercado — estado de pesquisa

Atualizado em 12/08/2026.

## Princípio

O MetaDex só armazena e exibe uma observação quando ela tem fonte, URL, preço, moeda e data/hora. O sistema não chama uma referência de “preço atual” se não houver snapshot verificável.

## Fontes pesquisadas

- **TCGdex**: fonte de catálogo usada pelo produto. A API é adequada para identificar cartas, mas não é a referência de preço brasileira. [TCGdex](https://github.com/tcgdex)
- **MYP Cards**: marketplace brasileiro que exibe páginas públicas de produto e de histórico/mediana de preço. Nenhuma API pública de preços foi confirmada nesta etapa; um conector só será ativado após confirmação dos termos e do caminho técnico permitido. [MYP Cards](https://mypcards.com/), [exemplo de histórico](https://mypcards.com/pokemon/preco/41793/mewtwo)
- **Liga Pokémon**: permanece uma referência importante para comparação brasileira, mas nenhuma API pública foi confirmada nesta etapa. Não haverá scraping agressivo, contorno de bloqueio ou integração declarada como pronta sem dados verificáveis.

## O que funciona agora

O endpoint autenticável `POST /api/market/observations` aceita uma observação real de um administrador/fonte autorizada e persiste um snapshot auditável no PostgreSQL. O Market Engine calcula mediana, média, menor valor, confiança, tendência, desconto e elegibilidade de alerta apenas entre observações equivalentes em carta, condição, idioma, variante e grade.

## Próximo conector externo

Antes de ligar Liga Pokémon ou MYP Cards como provider automático: registrar os termos consultados, a frequência permitida, cache/rate limit e o campo de identificação que preserva condição, idioma, variante e URL original.
