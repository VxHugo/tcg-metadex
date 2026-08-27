# Ponte Liga Pokémon para TCG MetaDex

Extensão local para importar para o MetaDex os preços apresentados na página da Liga Pokémon que você abriu. Ela lê apenas a aba ativa da Liga e envia o resultado apenas para `http://localhost:3000` aberto no seu computador. Não usa login, proxy, CAPTCHA, repetição automática ou método de evasão.

## Instalar localmente

1. No Chrome/Brave, abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione esta pasta (`apps/liga-bridge`).
4. No MetaDex, abra o detalhe de uma carta e use **Abrir busca na Liga Pokémon**.
5. Na aba da Liga, abra a extensão e clique em **Importar para o MetaDex aberto**.

Se houver diversas edições para o nome pesquisado, o MetaDex mantém todas separadas para você conferir a edição certa.
