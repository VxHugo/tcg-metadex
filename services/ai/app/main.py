from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .scanner import extract_card_fields
from .tcgdex import resolve_cards

app = FastAPI(title="TCG Intelligence Scanner", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "opencv+tesseract+tcgdex"}


@app.post("/scan")
async def scan(file: UploadFile = File(...)) -> dict:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="O arquivo precisa ser uma imagem.")

    raw = await file.read()
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Imagem maior que 12 MB.")

    try:
        ocr = extract_card_fields(raw)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Não foi possível ler a imagem: {exc}") from exc

    candidates = await resolve_cards(ocr.name, ocr.number)
    return {
        "engine": "opencv+tesseract+tcgdex",
        "extracted": {"name": ocr.name, "number": ocr.number},
        "candidates": [candidate.as_dict() for candidate in candidates],
    }
