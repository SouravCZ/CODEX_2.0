"""Tests for the vitals (rPPG) analyzer.

Uses the committed face-image / face-video fixtures plus ffmpeg-generated
no-face and too-short videos (checked into tmp_path) to exercise the happy
path and both guard errors.
"""

import subprocess
from pathlib import Path

import pytest

from api.services.vitals_analyzer import analyze_video

FIXTURES = Path(__file__).parent / "fixtures"
FACE_IMAGE = FIXTURES / "img1.jpg"
FACE_VIDEO = FIXTURES / "sample_checkin.mp4"


def _ffmpeg(args, out: Path):
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        *args,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


@pytest.fixture
def no_face_video(tmp_path):
    """12 s of blank gray frames — no face anywhere."""
    out = tmp_path / "noface.mp4"
    _ffmpeg(["-f", "lavfi", "-i", "color=c=gray:s=640x864:d=12"], out)
    return out


@pytest.fixture
def short_face_video(tmp_path):
    """3 s loop of the face image — visible face but under MIN_SECONDS."""
    out = tmp_path / "short_face.mp4"
    _ffmpeg(["-loop", "1", "-i", str(FACE_IMAGE), "-t", "3", "-r", "15"], out)
    return out


def test_analyze_video_happy_path():
    result = analyze_video(str(FACE_VIDEO))
    for key in (
        "hr_bpm", "hrv_rmssd_ms", "hrv_sdnn_ms",
        "stress_vital", "confidence", "frames_processed", "duration_s",
    ):
        assert key in result
    assert 40 <= result["hr_bpm"] <= 130
    assert 0.0 <= result["stress_vital"] <= 1.0
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["frames_processed"] > 0
    assert result["duration_s"] >= 8.0


def test_analyze_video_no_face_raises(no_face_video):
    with pytest.raises(ValueError, match="face not consistently visible"):
        analyze_video(str(no_face_video))


def test_analyze_video_too_short_raises(short_face_video):
    with pytest.raises(ValueError, match="signal too short"):
        analyze_video(str(short_face_video))
