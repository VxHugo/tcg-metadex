# Design spec — TCG Intelligence

## Referências visuais
- As referências editoriais fornecidas pelo usuário orientaram a interface durante o desenvolvimento local.
- Os bitmaps de referência não são distribuídos neste repositório porque incluem arte de terceiros. A direção visual abaixo preserva os elementos reutilizáveis sem redistribuir essas imagens.

## Direção
A marca deve parecer uma mistura de **arquivo de colecionador**, **revista editorial premium** e **ferramenta de inteligência de mercado**.

Evitar:
- dashboard SaaS genérico azul/cinza;
- estética neon/gamer;
- excesso de gradientes, glassmorphism e sombras pesadas;
- UI infantil baseada apenas no amarelo/azul da franquia.

## Paleta sugerida
Use tokens CSS e ajuste por contraste/acessibilidade:
- Burgundy 950: `#3A060B`
- Burgundy 900: `#52090F`
- Burgundy 800: `#700F18`
- Wine accent: `#8C1621`
- Cream 50: `#FBF7EF`
- Cream 100: `#F4EDDF`
- Warm line: `#D8CABB`
- Ink: `#2A1715`
- Muted ink: `#7C6D67`

Não trate esses hex como obrigação absoluta; preserve a sensação visual.

## Tipografia
- Display/headings: serif editorial elegante (preferir fonte open-source/licenciada via pacote/webfont confiável).
- UI/body: sans-serif discreta, alta legibilidade.
- Itálico pode ser usado pontualmente em frases curatoriais e títulos.

## Desktop
- sidebar vinho fixa/compacta;
- superfície principal creme;
- header editorial, sem navbar pesada;
- métricas em cards de borda fina;
- cards de Pokémon com imagem dominante;
- gráficos finos e discretos;
- CTAs em blocos vinho, não botões brilhantes.

## Mobile
- navegação inferior simples;
- telas de scanner com fundo vinho;
- cards/details com boa área de toque;
- câmera/upload deve ser protagonista;
- não apenas comprimir o desktop: reorganizar hierarquia para uso com uma mão.

## Componentes prioritários
- AppShell
- Sidebar / BottomNav
- EditorialHeader
- MetricCard
- PokemonCardTile
- PriceHistoryChart
- OpportunityBanner
- FilterBar
- EmptyState
- ScanViewfinder
- ScanCandidateCard
- CollectionListItem
- WishlistItem

## Motion
Pouca animação, com propósito:
- transições rápidas de hover/focus;
- skeletons suaves;
- scan confirmation/progress;
- evitar parallax/efeitos decorativos pesados.

## Acessibilidade
- contraste AA em textos/controles;
- foco visível;
- navegação por teclado no desktop;
- labels reais para inputs;
- texto alternativo nas imagens;
- estados não dependem apenas de cor.
