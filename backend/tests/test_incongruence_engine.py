"""Tests for the incongruence (multi-signal drift) engine.

Covers the per-signal wellbeing mappers (including 0-100 -> 0-1 face-score
normalization) and the full fusion: masking detection, pairwise disagreements,
wellness index and human-readable explanations.
"""

from api.services.incongruence_engine import (
    assess_incongruence,
    face_to_wellbeing,
    text_to_wellbeing,
    vitals_to_wellbeing,
    voice_to_wellbeing,
)


def test_face_to_wellbeing_empty():
    assert face_to_wellbeing({}) == 0.5


def test_face_to_wellbeing_extremes():
    assert face_to_wellbeing({"happy": 1.0}) == 1.0
    assert face_to_wellbeing({"sad": 1.0}) == 0.0
    assert face_to_wellbeing({"neutral": 1.0}) == 0.75


def test_face_to_wellbeing_normalizes_100_scale():
    assert face_to_wellbeing({"happy": 100}) == 1.0
    assert face_to_wellbeing({"sad": 100}) == 0.0


def test_voice_to_wellbeing():
    assert voice_to_wellbeing({"vitality": 1.0, "stress_voice": 0.0}) == 1.0
    assert voice_to_wellbeing({"vitality": 0.0, "stress_voice": 1.0}) == 0.0
    assert voice_to_wellbeing({}) == 0.5


def test_voice_to_wellbeing_missing_fields():
    # Missing fields fall back to a neutral 0.5.
    assert voice_to_wellbeing({"vitality": 1.0}) == 0.75
    assert voice_to_wellbeing({"stress_voice": 1.0}) == 0.25


def test_vitals_to_wellbeing():
    assert vitals_to_wellbeing({"stress_vital": 0.0}) == 1.0
    assert vitals_to_wellbeing({"stress_vital": 1.0}) == 0.0
    assert vitals_to_wellbeing({}) == 0.5


def test_text_to_wellbeing():
    assert text_to_wellbeing({"sentiment_score": 1.0, "stress_level": "low"}) == 1.0
    assert text_to_wellbeing({"sentiment_score": -1.0, "stress_level": "low"}) == 0.0
    assert text_to_wellbeing({"sentiment_score": 1.0, "stress_level": "high"}) == 0.7
    assert text_to_wellbeing({}) == 0.5


def test_no_signals():
    result = assess_incongruence()
    assert result["aligned"] is True
    assert result["masking_level"] == "none"
    assert result["masking_score"] == 0.0
    assert result["wellness_index"] is None
    assert result["signals_available"] == 0
    assert "No signals" in result["explanation"]


def test_aligned_signals():
    result = assess_incongruence(
        face_scores={"happy": 0.2, "neutral": 0.4},
        voice={"vitality": 0.7, "stress_voice": 0.3},
        vitals={"stress_vital": 0.3},
        text={"sentiment_score": 0.4, "stress_level": "low"},
    )
    assert result["aligned"] is True
    assert result["masking_level"] == "none"
    assert result["disagreements"] == []
    assert result["wellness_index"] == 70.0
    assert result["signals_available"] == 4


def test_masking_pattern_detected():
    # Words + face read positive while voice + vitals read negative.
    result = assess_incongruence(
        face_scores={"happy": 1.0},
        voice={"vitality": 0.2, "stress_voice": 0.8},
        vitals={"stress_vital": 0.9},
        text={"sentiment_score": 0.8, "stress_level": "low"},
    )
    assert result["masking_level"] == "significant"
    assert result["masking_score"] >= 0.5
    assert not result["aligned"]
    assert "Masked stress detected" in result["explanation"]
    assert len(result["disagreements"]) > 0


def test_pairwise_disagreement_reported():
    result = assess_incongruence(
        face_scores={"happy": 1.0},
        vitals={"stress_vital": 1.0},
    )
    assert result["disagreements"][0]["delta"] >= 0.25
    assert result["disagreements"][0]["pair"]
    assert "read" in result["disagreements"][0]["detail"]


def test_single_signal():
    result = assess_incongruence(face_scores={"happy": 1.0})
    assert result["signals_available"] == 1
    assert result["wellness_index"] == 100.0
    assert "Only one signal" in result["explanation"]
    assert result["masking_level"] == "none"
