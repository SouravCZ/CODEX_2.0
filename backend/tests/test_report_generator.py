"""Tests for the AI report narrative generator.

Covers the payload shaping, the deterministic (no-AI) fallback narrative, and
the normalization that merges a partial AI response over the fallback so the
canonical 5-field shape is always complete and valid.
"""

from api.services.report_generator import (
    compact_payload,
    deterministic_narrative,
    normalize_narrative,
)

SAMPLE = {
    "checkin_id": "11111111-1111-1111-1111-111111111111",
    "wellness_index": 61.5,
    "masking_level": "mild",
    "masking_score": 0.38,
    "aligned": False,
    "signals_available": 4,
    "signal_scores": {"face": 0.8, "voice": 0.7, "body": 0.42, "words": 0.85},
    "disagreements": [
        {"pair": "face vs vitals", "delta": 0.38, "detail": "x"},
        {"pair": "words vs vitals", "delta": 0.43, "detail": "y"},
    ],
    "signals": {
        "face": {"detected_emotion": "neutral", "confidence": 0.9, "scores": {"neutral": 0.9}},
        "voice": {"vitality": 0.6, "voice_tone": "warm", "stress_voice": 0.7, "confidence": 0.8},
        "vitals": {"hr_bpm": 84.0, "hrv_rmssd_ms": 22.0, "stress_vital": 0.71, "confidence": 0.7},
        "text": {
            "sentiment_score": 0.1,
            "sentiment_label": "positive",
            "emotional_tone": "calm",
            "stress_level": "low",
            "key_themes": [],
        },
    },
    "recommendation": "x",
}


def _assert_shape(narrative):
    assert set(narrative.keys()) == {"summary", "channels", "somatic_body", "journal_prompt"}
    assert set(narrative["channels"].keys()) == {"face", "voice", "heartbeat", "words"}
    for value in narrative["channels"].values():
        assert isinstance(value, str) and value.strip()
    for field in ("summary", "somatic_body", "journal_prompt"):
        assert isinstance(narrative[field], str) and narrative[field].strip()


def test_compact_payload_keys():
    payload = compact_payload(SAMPLE)
    assert set(payload.keys()) == {
        "wellness_index",
        "masking_level",
        "masking_score",
        "aligned",
        "signal_scores",
        "disagreements",
        "face",
        "voice",
        "heartbeat",
        "words",
    }
    assert payload["heartbeat"]["hr_bpm"] == 84.0


def test_compact_payload_missing_signals():
    payload = compact_payload({"signals": {"face": None}, "aligned": True})
    assert payload["face"]["detected_emotion"] is None
    assert payload["words"]["sentiment_score"] is None


def test_deterministic_masked_shape_and_content():
    narrative = deterministic_narrative(compact_payload(SAMPLE))
    _assert_shape(narrative)
    assert "masked-stress" in narrative["summary"]
    assert "heartbeat" in narrative["summary"]
    assert "face" in narrative["channels"]
    assert "neutral" in narrative["channels"]["face"]
    assert "84 bpm" in narrative["channels"]["heartbeat"]
    assert "positive" in narrative["channels"]["words"]


def test_deterministic_aligned():
    report = dict(SAMPLE)
    report.update(aligned=True, masking_level="none", masking_score=0.0, disagreements=[])
    narrative = deterministic_narrative(compact_payload(report))
    _assert_shape(narrative)
    assert "in sync" in narrative["summary"]


def test_deterministic_no_signals():
    narrative = deterministic_narrative(
        compact_payload({"signals": {}, "aligned": True, "masking_level": "none"})
    )
    _assert_shape(narrative)
    assert "No facial signal" in narrative["channels"]["face"]


def test_normalize_merges_ai_over_fallback():
    fallback = deterministic_narrative(compact_payload(SAMPLE))
    ai_partial = {
        "summary": "AI summary line",
        "channels": {"face": "AI face note", "vitals": "AI heartbeat note", "text": "AI words note"},
        "somatic_body": "AI somatic",
        "journal_prompt": "AI prompt",
    }
    merged = normalize_narrative(ai_partial, fallback)
    _assert_shape(merged)
    assert merged["summary"] == "AI summary line"
    # raw keys map onto the canonical channel keys
    assert merged["channels"]["face"] == "AI face note"
    assert merged["channels"]["heartbeat"] == "AI heartbeat note"
    assert merged["channels"]["words"] == "AI words note"
    # missing channel falls back to deterministic copy
    assert "Voice analysis" in merged["channels"]["voice"]


def test_normalize_ignores_garbage():
    fallback = deterministic_narrative(compact_payload(SAMPLE))
    merged = normalize_narrative({"channels": "not-a-dict", "summary": 42}, fallback)
    _assert_shape(merged)
    assert merged["summary"] == fallback["summary"]
