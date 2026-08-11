# Licenças, referências e reutilização

## Referências pesquisadas

### Trust1509/pokecollect — MIT
https://github.com/Trust1509/pokecollect

Referência funcional/arquitetural para catálogo TCGdex, coleção, binder, OCR e confirmação de scan. O repositório declara licença MIT.

### t-sinclair2500/pokemon-scanner — MIT
https://github.com/t-sinclair2500/pokemon-scanner

Referência arquitetural para separar captura, OCR, resolução, matching e pricing. O repositório declara licença MIT.

### bigbadsora/pokemon_tcg_collector — MIT
https://github.com/bigbadsora/pokemon_tcg_collector

Referência de estrutura Next.js + FastAPI para collection tracker. O repositório declara licença MIT.

### tcgdex/javascript-sdk — MIT
https://github.com/tcgdex/javascript-sdk

Referência oficial para integração com TCGdex. Neste MVP usamos a API REST diretamente para reduzir dependências.

## Política aplicada neste projeto

- O código novo foi reimplementado para este produto; não foi feita cópia extensa/verbatim de arquivos de terceiros.
- As ideias e padrões arquiteturais dos projetos MIT acima foram usados como referência.
- Não incorporar código AGPL/GPL em módulos proprietários sem uma decisão explícita sobre a licença do produto final.
- Manter adapters de fontes externas separados para facilitar troca de API/marketplace.
- Antes de comercializar, fazer revisão de licença de dependências transitivas, termos das fontes de preço e uso de imagens/dados.
