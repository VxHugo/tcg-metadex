# Telegram Collector

Pipeline:

1. Receber mensagem de fonte autorizada.
2. Persistir mensagem original e timestamp.
3. Extrair nome do produto/carta.
4. Extrair preço.
5. Extrair loja, URL e condições quando disponíveis.
6. Resolver produto no catálogo.
7. Consultar Price Engine.
8. Calcular Opportunity Score.
9. Gerar alerta/publicação.

Importante: respeitar termos, permissões, limites e regras aplicáveis às fontes e plataformas.
