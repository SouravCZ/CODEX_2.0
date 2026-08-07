from typing import Optional


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _normalize_scores(scores: dict) -> dict:
    """DeepFace returns 0-100 emotion scores; normalize to 0-1 if needed."""
    if not scores:
        return {}
    if max(scores.values()) > 1.0:
        return {k: v / 100.0 for k, v in scores.items()}
    return dict(scores)


def face_to_wellbeing(scores: dict) -> float:
    """Map facial emotion probabilities to a 0-1 wellbeing score."""
    s = _normalize_scores(scores)
    if not s:
        return 0.5
    pos = s.get("happy", 0.0) + 0.2 * s.get("surprise", 0.0)
    neg = s.get("sad", 0.0) + s.get("angry", 0.0) + s.get("fear", 0.0) + s.get("disgust", 0.0)
    neutral = 0.5 * s.get("neutral", 0.0)
    return round(_clamp((pos + neutral - neg + 1.0) / 2.0), 4)


def voice_to_wellbeing(voice: dict) -> float:
    """Map vocal biomarkers to a 0-1 wellbeing score."""
    vitality = voice.get("vitality")
    stress_voice = voice.get("stress_voice")
    if vitality is None and stress_voice is None:
        return 0.5
    v = vitality if vitality is not None else 0.5
    s = stress_voice if stress_voice is not None else 0.5
    return round(_clamp(0.5 * v + 0.5 * (1.0 - s)), 4)


def vitals_to_wellbeing(vitals: dict) -> float:
    """Map HRV vitals to a 0-1 wellbeing score."""
    stress = vitals.get("stress_vital")
    if stress is None:
        return 0.5
    return round(_clamp(1.0 - stress), 4)


def text_to_wellbeing(text: dict) -> float:
    """Map journal analysis to a 0-1 wellbeing score."""
    sentiment = text.get("sentiment_score")
    stress = text.get("stress_level")
    if sentiment is None and stress is None:
        return 0.5
    s = sentiment if sentiment is not None else 0.0
    stress_penalty = {"high": 0.3, "moderate": 0.15, "low": 0.0}.get(stress, 0.0)
    return round(_clamp((s + 1.0) / 2.0 - stress_penalty), 4)


SIGNAL_LABELS = {
    "words": "your words",
    "face": "your expression",
    "voice": "how you sounded",
    "body": "your heart-rate signals",
}

SIGNAL_LABELS_SHORT = {
    "words": "words",
    "face": "face",
    "voice": "voice",
    "body": "vitals",
}

_SHORT_TO_KEY = {v: k for k, v in SIGNAL_LABELS_SHORT.items()}

WEIGHTS = {"words": 0.3, "face": 0.25, "voice": 0.25, "body": 0.2}


def _describe_pair(high_signal: str, low_signal: str) -> str:
    return (
        f"{SIGNAL_LABELS[high_signal]} read noticeably more positive "
        f"than {SIGNAL_LABELS[low_signal]} — one channel is not telling the whole story."
    )


def assess_incongruence(
    face_scores: Optional[dict] = None,
    voice: Optional[dict] = None,
    vitals: Optional[dict] = None,
    text: Optional[dict] = None,
) -> dict:
    """Fuse face, voice, vitals and text into a single emotional X-ray.

    Each available signal is mapped to a 0-1 wellbeing score. The engine
    measures pairwise disagreement (incongruence) and isolates the signature
    pattern of *masking*: self-presented channels (words + face) reading
    positive while physiological channels (voice + vitals) read negative.
    """
    signals = {
        "words": text_to_wellbeing(text) if text else None,
        "face": face_to_wellbeing(face_scores) if face_scores else None,
        "voice": voice_to_wellbeing(voice) if voice else None,
        "body": vitals_to_wellbeing(vitals) if vitals else None,
    }
    available = [k for k, v in signals.items() if v is not None]
    n = len(available)

    if n == 0:
        return {
            "aligned": True,
            "masking_level": "none",
            "masking_score": 0.0,
            "wellness_index": None,
            "signal_scores": signals,
            "disagreements": [],
            "explanation": "No signals were available for analysis.",
            "signals_available": 0,
        }

    # Pairwise disagreement across every available pair
    disagreements = []
    for i, a in enumerate(available):
        for b in available[i + 1:]:
            delta = round(abs(signals[a] - signals[b]), 4)
            if delta >= 0.25:
                high, low = (a, b) if signals[a] > signals[b] else (b, a)
                disagreements.append({
                    "pair": f"{SIGNAL_LABELS_SHORT[high]} vs {SIGNAL_LABELS_SHORT[low]}",
                    "delta": delta,
                    "detail": _describe_pair(high, low),
                })
    disagreements.sort(key=lambda d: d["delta"], reverse=True)
    max_delta = max((signals[a] - signals[b] for a in available for b in available
                     if signals[a] > signals[b] + 0.25), default=0.0)
    overall_delta = round(max_delta, 4)

    # Masking pattern: self-presented (words + face) vs physiology (voice + body)
    presented = [signals[k] for k in ("words", "face") if k in available]
    physiology = [signals[k] for k in ("voice", "body") if k in available]
    presented_keys = [k for k in ("words", "face") if k in available]
    physiology_keys = [k for k in ("voice", "body") if k in available]
    suppression = 0.0
    if presented and physiology:
        gap = (sum(presented) / len(presented)) - (sum(physiology) / len(physiology))
        suppression = _clamp(gap)

    masking_score = round(_clamp(0.55 * overall_delta + 0.45 * suppression), 4)

    if masking_score >= 0.5:
        masking_level = "significant"
    elif masking_score >= 0.3:
        masking_level = "mild"
    else:
        masking_level = "none"

    aligned = masking_level == "none"

    # Wellness index: weighted blend of available signals, renormalized
    total_weight = sum(WEIGHTS[k] for k in available)
    if total_weight == 0:
        wellness = None
    else:
        wellness = round(sum(WEIGHTS[k] * signals[k] for k in available) / total_weight * 100.0, 1)

    # Human-readable explanation
    if n == 1:
        explanation = "Only one signal was captured; add face, voice or vitals to unlock drift detection."
    elif masking_level == "significant":
        if suppression >= 0.45:
            presented_labels = " and ".join(SIGNAL_LABELS[k] for k in presented_keys)
            physiology_labels = " and ".join(SIGNAL_LABELS[k] for k in physiology_keys)
            explanation = (
                f"Masked stress detected — {presented_labels} say you are fine, but "
                f"{physiology_labels} tell a different story. You may be holding back "
                "how you really feel."
            )
        elif disagreements:
            hi, lo = disagreements[0]["pair"].split(" vs ")
            hi = _SHORT_TO_KEY.get(hi, hi)
            lo = _SHORT_TO_KEY.get(lo, lo)
            explanation = (
                f"Masked stress detected — {SIGNAL_LABELS[hi]} read positive, but "
                f"{SIGNAL_LABELS[lo]} read negative. The two channels disagree."
            )
        else:
            explanation = "Signals show a significant mismatch worth a closer look."
    elif masking_level == "mild":
        explanation = (
            "Slight mismatch between your signals — your body and your words are "
            "not fully in sync. Worth watching over the next few days."
        )
    else:
        explanation = (
            "Your signals are aligned — how you feel on the inside matches how you "
            "present on the outside."
        )

    return {
        "aligned": aligned,
        "masking_level": masking_level,
        "masking_score": masking_score,
        "wellness_index": wellness,
        "signal_scores": signals,
        "disagreements": disagreements,
        "explanation": explanation,
        "signals_available": n,
    }
