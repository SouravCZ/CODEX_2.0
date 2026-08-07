"""Tests for the voice biomarker analyzer.

Synthesizes deterministic test audio (a voiced vibrato tone and pure silence)
in a temp dir so no binary fixtures are required, and checks the analyzer's
vitality/tone/stress outputs plus its error paths.
"""

import numpy as np
import pytest
from scipy.io import wavfile

from api.services.voice_analyzer import SR, analyze_voice

TONE_SECONDS = 3.0


def _write_wav(path, samples, sr=SR):
    y = np.clip(samples, -1.0, 1.0)
    wavfile.write(str(path), sr, (y * 32767).astype(np.int16))


@pytest.fixture
def tone_wav(tmp_path):
    """A 140 Hz voiced tone with vibrato + amplitude modulation (3 s)."""
    t = np.arange(int(SR * TONE_SECONDS)) / SR
    f0 = 140.0 + 6.0 * np.sin(2 * np.pi * 5.0 * t)
    phase = 2 * np.pi * np.cumsum(f0) / SR
    amp = 0.5 * (0.7 + 0.3 * np.sin(2 * np.pi * 3.0 * t))
    path = tmp_path / "tone.wav"
    _write_wav(path, amp * np.sin(phase))
    return path


@pytest.fixture
def silence_wav(tmp_path):
    path = tmp_path / "silence.wav"
    _write_wav(path, np.zeros(int(SR * 2.0)))
    return path


def test_analyze_voice_shape_and_ranges(tone_wav):
    result = analyze_voice(str(tone_wav))
    for key in ("vitality", "voice_tone", "stress_voice", "confidence", "features"):
        assert key in result
    assert 0.0 <= result["vitality"] <= 1.0
    assert 0.0 <= result["stress_voice"] <= 1.0
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["features"]["duration_s"] == pytest.approx(TONE_SECONDS)


def test_analyze_voice_detects_voiced_tone(tone_wav):
    result = analyze_voice(str(tone_wav))
    assert result["voice_tone"] != "insufficient_audio"
    assert result["features"]["voiced_ratio"] >= 0.9
    assert result["features"]["f0_mean_hz"] == pytest.approx(140.0, abs=20.0)
    assert result["confidence"] > 0.0


def test_analyze_voice_silence(silence_wav):
    result = analyze_voice(str(silence_wav))
    assert result["voice_tone"] == "insufficient_audio"
    assert result["stress_voice"] == 0.5
    assert result["confidence"] == 0.0
    assert result["features"]["voiced_ratio"] == 0.0
    assert result["vitality"] == 0.0


def test_analyze_voice_empty_file_raises(tmp_path):
    empty = tmp_path / "empty.wav"
    empty.write_bytes(b"")
    with pytest.raises(ValueError, match="Voice analysis failed"):
        analyze_voice(str(empty))


def test_analyze_voice_non_audio_raises(tmp_path):
    junk = tmp_path / "note.txt"
    junk.write_text("hello")
    with pytest.raises(ValueError, match="Voice analysis failed"):
        analyze_voice(str(junk))
