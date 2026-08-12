# Redesign de interface — TCG MetaDex

## Referências analisadas

- A referência visual fornecida apontou uma landing page leve, com hierarquia tipográfica forte, conteúdo espaçado e uma experiência desktop/mobile coerente.
- A pesquisa de catálogos brasileiros, como Cartas de Pokémon BR, MeuDex e PokeSpace, mostrou a expectativa local de encontrar uma carta por nome, número e coleção; ver informação de set; e registrar ou comparar valores em reais quando a origem do dado for clara.
- A documentação e a busca do TCGplayer mostraram dois padrões úteis para produtos de cards: filtros progressivos por coleção, raridade, tipo e condição, além da alternância entre resultados densos e informações de preço contextualizadas.
- O fluxo Scan & Identify do TCGplayer reforçou a necessidade de mostrar confiança e pedir confirmação explícita quando uma leitura de imagem encontra candidatos.

## Decisões visuais e de UX

- A antiga estética vinho/editorial foi substituída por superfície off-white, cartões brancos, azul como ação principal e acentos de estado restritos. O resultado é mais próximo de uma ferramenta de coleção do que de um painel administrativo genérico.
- A busca agora ocupa a área mais importante do catálogo, com atalhos de busca e uma barra global que leva diretamente a ela.
- O dashboard prioriza quatro métricas legíveis, uma ação primária e estados vazios honestos. Nenhum valor ou oportunidade demonstrativa é apresentado como dado real.
- Coleção e catálogo adotam uma grade de dados familiar no desktop e cartões densos no mobile. Identidade da carta, set, condição, quantidade e preço de referência aparecem em uma ordem consistente.
- O scanner ganhou um fluxo em três etapas: qualidade da foto, identificação e confirmação do candidato. A confiança da leitura fica explícita.
- O mobile usa navegação inferior e áreas de toque maiores, sem tentar replicar a navegação lateral do desktop.

## Radar de Selados — direção visual (12/08/2026)

- As referências recentes orientaram um contraste mais forte: superfícies claras e azul-violeta elétrico para ações, combinados a um painel quase preto para a área principal de compra.
- O Radar de Selados recebeu um hero próprio, tipografia de alto impacto, linhas de grade discretas, halo luminoso, anéis de radar e um objeto de produto abstrato. Nenhuma arte, embalagem ou marca da referência foi copiada.
- Os efeitos são nativos de CSS: brilho que percorre o objeto, varredura circular, pulso de status, entrada escalonada dos cards e elevação no hover. Há uma regra de `prefers-reduced-motion` que remove movimento para quem preferir menos animação.
- As interações têm propósito: os cards de formato mudam a categoria consultada, os links abrem a fonte original, o CTA leva à categoria ativa e o segundo CTA rola até as coleções reais.

## Originalidade e limites

As referências foram usadas apenas para entender padrões de navegação, densidade, filtros e clareza de dados. Não foi copiado layout, marca, texto, ícone proprietário ou arte de terceiros. A marca gráfica do MetaDex é original e a aplicação continua exibindo imagens de cartas apenas por meio do catálogo externo já integrado.

