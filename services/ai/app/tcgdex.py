from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from rapidfuzz import fuzz

BASE_URL = "https://api.tcgdex.net/v2/en"


@dataclass(slots=True)
class Candidate:
    id: str
    name: str
    number: str | None
    set_name: str | None
    image: str | None
    confidence: float
    reference_amount: float | None = None
    reference_currency: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "number": self.number,
            "setName": self.set_name,
            "image": self.image,
            "confidence": round(self.confidence, 4),
            "reference": (
                {
                    "amount": self.reference_amount,
                    "currency": self.reference_currency or "EUR",
                    "source": "TCGdex / Cardmarket",
                }
                if self.reference_amount is not None
                else None
            ),
        }


def _reference(card: dict[str, Any]) -> tuple[float | None, str | None]:
    pricing = card.get("pricing") or {}
    cm = pricing.get("cardmarket") or {}
    value = cm.get("trend") or cm.get("avg7") or cm.get("avg") or cm.get("low")
    try:
        return (float(value), str(cm.get("unit") or "EUR").upper()) if value is not None else (None, None)
    except (TypeError, ValueError):
        return (None, None)


async def _detail(client: httpx.AsyncClient, card_id: str) -> dict[str, Any] | None:
    response = await client.get(f"{BASE_URL}/cards/{card_id}")
    if response.status_code != 200:
        return None
    return response.json()


async def resolve_cards(name: str | None, number: str | None, limit: int = 5) -> list[Candidate]:
    """Resolve OCR fields against TCGdex using field scores instead of trusting one OCR value."""
    params: dict[str, str | int] = {"pagination:page": 1, "pagination:itemsPerPage": 60}
    if name:
        params["name"] = name

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        response = await client.get(f"{BASE_URL}/cards", params=params)
        response.raise_for_status()
        briefs = response.json()

        # If OCR name is poor, the number is often more reliable. Use a broader pool as fallback.
        if not briefs and number:
            response = await client.get(
                f"{BASE_URL}/cards",
                params={"localId": number, "pagination:page": 1, "pagination:itemsPerPage": 60},
            )
            if response.status_code == 200:
                briefs = response.json()

        scored: list[tuple[float, dict[str, Any]]] = []
        for card in briefs:
            card_name = str(card.get("name", ""))
            card_number = str(card.get("localId", ""))
            name_score = fuzz.ratio((name or "").lower(), card_name.lower()) / 100 if name else 0.55
            number_score = 1.0 if number and card_number.strip().lower() == number.strip().lower() else (0.35 if number else 0.55)
            score = name_score * 0.62 + number_score * 0.38
            scored.append((score, card))

        scored.sort(key=lambda item: item[0], reverse=True)
        candidates: list[Candidate] = []
        for score, brief in scored[:limit]:
            detail = await _detail(client, brief["id"])
            data = detail or brief
            set_data = data.get("set") or {}
            reference_amount, reference_currency = _reference(data)
            candidates.append(
                Candidate(
                    id=data["id"],
                    name=data["name"],
                    number=str(data.get("localId", "")) or None,
                    set_name=set_data.get("name"),
                    image=data.get("image"),
                    confidence=score,
                    reference_amount=reference_amount,
                    reference_currency=reference_currency,
                )
            )

    return candidates
