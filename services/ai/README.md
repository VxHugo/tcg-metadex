# Scanner / IA

Serviço FastAPI funcional para o MVP.

Pipeline:

1. normaliza orientação EXIF;
2. tenta detectar o maior quadrilátero da foto e corrigir perspectiva com OpenCV;
3. roda OCR Tesseract em regiões superior/inferior e no quadro completo;
4. extrai nome e número provável;
5. consulta o catálogo TCGdex;
6. ranqueia candidatos com similaridade de nome + número;
7. devolve candidatos para confirmação manual.

## Rodar localmente

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

É necessário ter `tesseract` instalado no sistema. Com Docker isso já é feito pelo `Dockerfile`.

O frontend usa `SCANNER_URL=http://localhost:8001`. Se a variável não estiver configurada, a interface informa que o scanner real não está disponível; ela não cria candidatos fictícios.
