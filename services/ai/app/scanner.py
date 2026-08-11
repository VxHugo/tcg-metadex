from __future__ import annotations

import io
import re
from dataclasses import dataclass

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageOps

CARD_NUMBER_PATTERNS = [
    re.compile(r"\b([A-Z]{0,3}\d{1,4})\s*/\s*([A-Z]{0,3}\d{1,4})\b", re.I),
    re.compile(r"\b([A-Z]{0,3}\d{1,4})\s+of\s+([A-Z]{0,3}\d{1,4})\b", re.I),
]

NOISE_WORDS = {
    "basic", "stage", "trainer", "energy", "pokemon", "ability", "weakness",
    "resistance", "retreat", "illustrator", "hp", "rule", "attack",
}


@dataclass(slots=True)
class OcrResult:
    name: str | None
    number: str | None
    text: str


def _order_points(points: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    sums = points.sum(axis=1)
    diffs = np.diff(points, axis=1).reshape(-1)
    rect[0] = points[np.argmin(sums)]
    rect[2] = points[np.argmax(sums)]
    rect[1] = points[np.argmin(diffs)]
    rect[3] = points[np.argmax(diffs)]
    return rect


def perspective_normalize(image: np.ndarray) -> np.ndarray:
    """Detect the largest quadrilateral and rectify it. Falls back to the original image."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 60, 160)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:12]

    screen = None
    image_area = image.shape[0] * image.shape[1]
    for contour in contours:
        if cv2.contourArea(contour) < image_area * 0.18:
            continue
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) == 4:
            screen = approx.reshape(4, 2).astype("float32")
            break

    if screen is None:
        return image

    rect = _order_points(screen)
    tl, tr, br, bl = rect
    width = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    height = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    if width < 80 or height < 120:
        return image

    destination = np.array([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], dtype="float32")
    matrix = cv2.getPerspectiveTransform(rect, destination)
    return cv2.warpPerspective(image, matrix, (width, height))


def _ocr_variant(gray: np.ndarray, psm: int) -> str:
    enlarged = cv2.resize(gray, None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC)
    return pytesseract.image_to_string(enlarged, config=f"--oem 3 --psm {psm}")


def _guess_number(text: str) -> str | None:
    for pattern in CARD_NUMBER_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).upper()
    # Japanese/modern cards sometimes OCR a single collector number near the lower edge.
    matches = re.findall(r"\b(?:SVP|SWSH|SM|XY)?\d{2,4}\b", text, re.I)
    return matches[-1].upper() if matches else None


def _guess_name(text: str) -> str | None:
    lines = [re.sub(r"[^A-Za-zÀ-ÿ0-9' .\-]", " ", line).strip() for line in text.splitlines()]
    candidates: list[str] = []
    for line in lines[:12]:
        if not 3 <= len(line) <= 30:
            continue
        lower = line.lower()
        if any(word in lower.split() for word in NOISE_WORDS):
            continue
        if sum(ch.isalpha() for ch in line) < 3:
            continue
        candidates.append(re.sub(r"\s+", " ", line))
    return candidates[0] if candidates else None


def extract_card_fields(raw: bytes) -> OcrResult:
    pil = Image.open(io.BytesIO(raw))
    pil = ImageOps.exif_transpose(pil).convert("RGB")
    rgb = np.asarray(pil)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    normalized = perspective_normalize(bgr)
    gray = cv2.cvtColor(normalized, cv2.COLOR_BGR2GRAY)

    height = gray.shape[0]
    top = gray[: max(int(height * 0.36), 1), :]
    bottom = gray[int(height * 0.70) :, :]

    top_text = _ocr_variant(top, 6)
    bottom_text = _ocr_variant(bottom, 6)
    full_text = _ocr_variant(gray, 11)
    text = "\n".join([top_text, bottom_text, full_text])

    return OcrResult(name=_guess_name(top_text + "\n" + full_text), number=_guess_number(bottom_text + "\n" + full_text), text=text)
