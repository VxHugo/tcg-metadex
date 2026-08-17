# Fontes de mercado — estado de pesquisa

Atualizado em 12/08/2026.

## Princípio

O MetaDex só armazena e exibe uma observação quando ela tem fonte, URL, preço, moeda e data/hora. O sistema não chama uma referência de “preço atual” se não houver snapshot verificável.

## Fontes pesquisadas

- **TCGdex**: fonte de catálogo usada pelo produto. A API é adequada para identificar cartas, mas não é a referência de preço brasileira. [TCGdex](https://github.com/tcgdex)
- **MYP Cards**: marketplace brasileiro que exibe páginas públicas de produto e de histórico/mediana de preço. Nenhuma API pública de preços foi confirmada nesta etapa; um conector só será ativado após confirmação dos termos e do caminho técnico permitido. [MYP Cards](https://mypcards.com/), [exemplo de histórico](https://mypcards.com/pokemon/preco/41793/mewtwo)
- **Liga Pokémon**: permanece uma referência importante para comparação brasileira, mas nenhuma API pública foi confirmada nesta etapa. Não haverá scraping agressivo, contorno de bloqueio ou integração declarada como pronta sem dados verificáveis.
- **Mercado Livre**: a documentação oficial mantém os recursos de busca/listagens e os campos de preço atual e original no item. O Radar de Selados usa exclusivamente a API oficial quando `MELI_ACCESS_TOKEN` de um aplicativo autorizado estiver configurado. Sem token, o produto não tenta contornar o bloqueio nem faz scraping: oferece apenas links de busca direta por categoria. [Busca de itens](https://developers.mercadolivre.com.br/pt_br/itens-e-buscas), [preços de produtos](https://developers.mercadolivre.com.br/devcenter/api-de-precos), [termos](https://developers.mercadolivre.com.br/pt_br/termos-e-condicoes).

## Produtos selados

O Radar de Selados é a prioridade de compra do MetaDex. Ele classifica apenas anúncios novos em BRL nas categorias:

- packs e boosters;
- booster boxes/displays;
- blisters e tripacks;
- Elite Trainer Boxes (ETBs);
- boxes de coleção;
- premium collections e tins;
- decks.

Quando conectado, o radar preserva título, preço, preço anterior quando a fonte informar, percentual calculado de desconto, vendedor, frete, link original e data/hora de observação. Itens que não são novos, não estão em BRL ou não correspondem à categoria selecionada são descartados. A compra permanece na página original da loja; o usuário deve conferir lacre, idioma, edição, conteúdo e condições de venda.

## O que funciona agora

O endpoint autenticável `POST /api/market/observations` aceita uma observação real de um administrador/fonte autorizada e persiste um snapshot auditável no PostgreSQL. O Market Engine calcula mediana, média, menor valor, confiança, tendência, desconto e elegibilidade de alerta apenas entre observações equivalentes em carta, condição, idioma, variante e grade.

## Recomendações de compra e sinais de carta

A primeira tela do MetaDex consulta `GET /api/recommendations`. Ela não tem dados de exemplo: uma oportunidade só é publicada quando a oferta tem URL e preço verificáveis e fica pelo menos 12% abaixo de três ou mais observações atuais, equivalentes e de outras fontes. O card mostra preço da oferta, preço de referência, economia, fontes que formaram a referência e horário da consulta.

O bloco de cartas usa somente uma tendência positiva observada nos últimos 30 dias, com no mínimo três pontos em dias diferentes e duas fontes. Ele é chamado de **sinal de alta observada**, nunca de previsão, garantia ou recomendação financeira. Sem dados suficientes, os dois blocos permanecem vazios e explicam o critério que falta.

## Próximo conector externo

Antes de ligar Liga Pokémon ou MYP Cards como provider automático: registrar os termos consultados, a frequência permitida, cache/rate limit e o campo de identificação que preserva condição, idioma, variante e URL original.

Antes de ativar o Mercado Livre em produção: criar e aprovar o aplicativo na plataforma de desenvolvedores, guardar o token somente no servidor, implementar renovação OAuth e observar os limites de consulta permitidos.
