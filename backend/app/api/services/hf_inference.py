"""Hugging Face Inference API client (free tier).

Replaces the local DeepFace + transformers/torch models with hosted,
free-to-use classifiers:
  - face emotion: trpakov/vit-face-expression (image-classification)
  - text sentiment: distilbert-base-uncased-finetuned-sst-2-english (text-classification)

Every function raises ValueError on failure so callers can fall back to
deterministic logic (mirrors report_generator.py).
"""

import cv2
import httpx
import numpy as np

from core.config import get_settings

settings = get_settings()

FER_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]

_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def crop_largest_face(image_bytes: bytes, margin_ratio: float = 0.25) -> bytes | None:
    """Detect the largest face in an image and return a JPEG crop, or None.

    OpenCV does face *detection* locally (classical Haar, not an ML model);
    only the cropped face is sent to the HF emotion API. Returns None when no
    face is found so callers can degrade gracefully.
    """
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    mx, my = int(w * margin_ratio), int(h * margin_ratio)
    x0, y0 = max(0, x - mx), max(0, y - my)
    x1, y1 = min(img.shape[1], x + w + mx), min(img.shape[0], y + h + my)
    crop = img[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    ok, buf = cv2.imencode(".jpg", crop, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return buf.tobytes() if ok else None


def _headers() -> dict[str, str]:
    if not settings.HF_API_KEY:
        raise ValueError("HF_API_KEY is not configured")
    return {"Authorization": f"Bearer {settings.HF_API_KEY}"}


def _post_json(model: str, inputs: dict) -> list:
    url = f"{settings.HF_BASE_URL}/models/{model}"
    try:
        resp = httpx.post(
            url,
            headers=_headers(),
            json=inputs,
            timeout=settings.HF_TIMEOUT_S,
        )
    except httpx.HTTPError as exc:
        raise ValueError(f"HF Inference request failed: {exc}") from exc
    if resp.status_code >= 400:
        raise ValueError(
            f"HF Inference {model} returned {resp.status_code}: {resp.text[:200]}"
        )
    try:
        data = resp.json()
    except ValueError as exc:
        raise ValueError(f"HF Inference {model} returned non-JSON: {exc}") from exc
    if not isinstance(data, list):
        raise ValueError(f"HF Inference {model} unexpected payload: {data}")
    return data


def classify_face(image_bytes: bytes) -> dict:
    """Classify a face image via HF image-classification.

    Returns the same shape DeepFace produced:
        {"detected_emotion": str, "confidence": float, "scores": {label: float}}
    where `scores` is the full FER label distribution (0-1 normalized).
    """
    url = f"{settings.HF_BASE_URL}/models/{settings.HF_FACE_MODEL}"
    try:
        resp = httpx.post(
            url,
            headers=_headers(),
            content=image_bytes,
            timeout=settings.HF_TIMEOUT_S,
        )
    except httpx.HTTPError as exc:
        raise ValueError(f"HF Inference request failed: {exc}") from exc
    if resp.status_code >= 400:
        raise ValueError(
            f"HF Inference {settings.HF_FACE_MODEL} returned {resp.status_code}: {resp.text[:200]}"
        )
    try:
        data = resp.json()
    except ValueError as exc:
        raise ValueError(f"HF Inference face returned non-JSON: {exc}") from exc

    if not isinstance(data, list):
        raise ValueError(f"HF Inference face unexpected payload: {data}")

    # data: [{"label": "happy", "score": 0.87}, ...] sorted desc
    raw = {}
    for item in data:
        if isinstance(item, dict) and "label" in item:
            raw[str(item["label"]).lower()] = float(item.get("score", 0.0))

    scores = {label: raw.get(label, 0.0) for label in FER_LABELS}
    total = sum(scores.values())
    if total > 0:
        scores = {label: round(v / total, 4) for label, v in scores.items()}

    dominant = max(FER_LABELS, key=lambda l: scores[l])
    return {
        "detected_emotion": dominant,
        "confidence": round(scores[dominant], 4),
        "scores": scores,
    }


def classify_sentiment(text: str) -> dict:
    """Classify journal text via HF text-classification.

    Returns {"pos": float, "neg": float} where pos + neg == 1.
    """
    data = _post_json(settings.HF_SENTIMENT_MODEL, {"inputs": text})
    # data: [[{"label": "POSITIVE", "score": 0.99}, {"label": "NEGATIVE", ...}]]
    result = {"pos": 0.0, "neg": 0.0}
    for item in data[0] if data else []:
        label = str(item.get("label", "")).upper()
        score = float(item.get("score", 0.0))
        if label == "POSITIVE":
            result["pos"] = score
        elif label == "NEGATIVE":
            result["neg"] = score
    return result
