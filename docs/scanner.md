# Scanner — implementação MVP

Pipeline implementado em `services/ai/app`:

```text
upload
  -> EXIF normalize
  -> OpenCV: maior quadrilátero / perspectiva
  -> OCR Tesseract em top + bottom + full
  -> extração de nome e collector number
  -> busca TCGdex
  -> score de correspondência
  -> até 5 candidatos
  -> confirmação manual no frontend
  -> coleção
```

## Por que híbrido

O OCR sozinho erra bastante em cartas com arte sobre o título, fontes pequenas, foil e reflexo. Por isso o resultado não é aceito automaticamente: nome e número geram candidatos e a interface pede confirmação.

## Próxima evolução

- perceptual hash / embeddings visuais para rerank;
- índice local de imagens do catálogo;
- detecção de múltiplas cartas na mesma foto;
- binder page grid;
- suporte a PT/EN/JP e normalização de collector numbers por região;
- armazenar imagem original e crops para reprocessamento.
