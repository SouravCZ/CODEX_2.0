import uuid
from pathlib import Path

from api.services.hf_inference import classify_face, crop_largest_face

UPLOAD_DIR = Path("uploads/emotions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Supported emotion labels (FER2013, matches HF face model)
EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


def analyze_face(image_bytes: bytes) -> dict:
    """Analyze a face image and return emotion predictions via the HF API.

    OpenCV Haar is used locally to crop the largest face; the crop is sent to
    the hosted Hugging Face classifier. Returns the same shape DeepFace used to
    produce, and raises ValueError when no face is found or the API fails.
    """
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    try:
        crop = crop_largest_face(image_bytes)
        if crop is None:
            raise ValueError("Emotion analysis failed: no face detected")
        result = classify_face(crop)
        result = dict(result)
        result["image_path"] = str(filepath)
        return result
    except ValueError:
        if filepath.exists():
            filepath.unlink()
        raise
