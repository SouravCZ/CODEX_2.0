"""AI narrative generation for emotional drift reports.

Turns a raw checkin ``CheckinResponse`` payload into human-readable report
prose by calling an OpenAI-compatible chat-completions endpoint (DeepSeek by
default). Falls back to a deterministic, data-derived narrative when no API
key is configured or the provider call fails, so the report endpoint always
returns a complete, valid result.
"""

import json
import logging

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)

# Frontend narrative channel keys.
CHANNELS = ("face", "voice", "heartbeat", "words")

# Raw signal keys (from the checkin payload) -> narrative channel keys.
_RAW_TO_CHANNEL = {
    "face": "face",
    "voice": "voice",
    "vitals": "heartbeat",
    "text": "words",
}

# Short labels used inside disagreement pairs -> human channel labels.
_PAIR_LABEL = {
    "face": "face",
    "voice": "voice",
    "vitals": "heartbeat",
    "words": "words",
    "body": "heartbeat",
    "text": "words",
}

_NARRATIVE_SCHEMA_EXAMPLE = {
    "summary": "2-3 sentences synthesizing how the user's signals align or diverge.",
    "channels": {
        "face": "1-2 sentences on the facial emotion signals.",
        "voice": "1-2 sentences on the vocal acoustic signals.",
        "heartbeat": "1-2 sentences on the cardiovascular (HRV) signals.",
        "words": "1-2 sentences on the written/text signals.",
    },
    "somatic_body": "1-2 sentences on the body-level intervention priority.",
    "journal_prompt": "a short, introspective, first-person question.",
}

SYSTEM_PROMPT = """You are the narrative writer for an emotional-drift journaling app. You receive a compact JSON snapshot of a user's multi-signal check-in: facial emotion, voice acoustics, heart-rate variability, and optionally typed text.

Rules:
- Output ONLY valid JSON. Do not wrap it in markdown fences, and add no commentary outside the JSON.
- Match exactly this JSON shape (the word json in this prompt is deliberate):
{schema}
- "summary": a 2-3 sentence executive summary of how the signals align or diverge and what that means for the user right now.
- "channels": one short 1-2 sentence body per channel, using the exact keys face, voice, heartbeat, words.
- "somatic_body": one or two sentences recommending how the user can regulate their body before heavy cognitive work.
- "journal_prompt": one short, gentle, introspective question phrased in the first person.
- Ground every claim in the supplied numbers. Never invent metrics, timestamps, or measurements.
- If a channel was unavailable, note that briefly instead of inventing details.
- Keep the tone calm, supportive, concrete. Do not give medical diagnoses or clinical advice."""

USER_PROMPT = """Here is the check-in snapshot as JSON:
{payload}"""


# ── Payload shaping ────────────────────────────────────────────────────

def compact_payload(report: dict) -> dict:
    """Reduce a CheckinResponse dict to the fields the narrative needs."""
    signals = report.get("signals") or {}
    face = signals.get("face") or {}
    voice = signals.get("voice") or {}
    vitals = signals.get("vitals") or {}
    text = signals.get("text") or {}

    return {
        "wellness_index": report.get("wellness_index"),
        "masking_level": report.get("masking_level"),
        "masking_score": report.get("masking_score"),
        "aligned": report.get("aligned"),
        "signal_scores": report.get("signal_scores"),
        "disagreements": report.get("disagreements"),
        "face": {
            "detected_emotion": face.get("detected_emotion"),
            "confidence": face.get("confidence"),
            "scores": face.get("scores"),
        },
        "voice": {
            "vitality": voice.get("vitality"),
            "voice_tone": voice.get("voice_tone"),
            "stress_voice": voice.get("stress_voice"),
            "confidence": voice.get("confidence"),
        },
        "heartbeat": {
            "hr_bpm": vitals.get("hr_bpm"),
            "hrv_rmssd_ms": vitals.get("hrv_rmssd_ms"),
            "stress_vital": vitals.get("stress_vital"),
            "confidence": vitals.get("confidence"),
        },
        "words": {
            "sentiment_score": text.get("sentiment_score"),
            "sentiment_label": text.get("sentiment_label"),
            "emotional_tone": text.get("emotional_tone"),
            "stress_level": text.get("stress_level"),
            "key_themes": text.get("key_themes"),
        },
    }


# ── AI provider call ──────────────────────────────────────────────────

def generate_report(report: dict) -> dict:
    """Generate a narrative for a checkin report.

    Tries the configured AI provider first and falls back to the deterministic
    narrative on any error or when no API key is configured.
    """
    payload = compact_payload(report)
    settings = get_settings()
    if settings.AI_API_KEY:
        try:
            narrative = _call_provider(payload, settings)
            fallback = deterministic_narrative(payload)
            return normalize_narrative(narrative, fallback)
        except Exception as exc:
            logger.warning("AI narrative generation failed; using fallback: %s", exc)
    return deterministic_narrative(payload)


def _call_provider(payload: dict, settings) -> dict:
    body = {
        "model": settings.AI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(
                    schema=json.dumps(_NARRATIVE_SCHEMA_EXAMPLE, indent=2)
                ),
            },
            {
                "role": "user",
                "content": USER_PROMPT.format(payload=json.dumps(payload, indent=2)),
            },
        ],
        "response_format": {"type": "json_object"},
        "reasoning": {"enabled": False},
        "temperature": 0.7,
        "max_tokens": 700,
        "stream": False,
    }
    url = f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {settings.AI_API_KEY}"}

    last_error = None
    for _ in range(2):
        try:
            with httpx.Client(timeout=settings.AI_TIMEOUT_S) as client:
                resp = client.post(url, json=body, headers=headers)
            if resp.status_code >= 400:
                # Hard client errors (auth, balance, bad request) won't be fixed
                # by retrying — fail fast so the fallback is served quickly.
                if 400 <= resp.status_code < 500 and resp.status_code not in (408, 429):
                    resp.raise_for_status()
                resp.raise_for_status()
            content = (
                (resp.json().get("choices") or [{}])[0].get("message", {}).get("content", "")
            )
            if content and content.strip():
                return _parse_narrative(content)
        except httpx.HTTPStatusError as exc:
            last_error = exc
            if 400 <= exc.response.status_code < 500 and exc.response.status_code not in (408, 429):
                raise
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            last_error = exc
    raise RuntimeError(f"AI narrative generation failed: {last_error}") from last_error


def _parse_narrative(content: str) -> dict:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    # Some providers wrap the JSON in a short preamble — extract the object.
    if not cleaned.startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end > start:
            cleaned = cleaned[start : end + 1]
    data = json.loads(cleaned)
    if isinstance(data, dict) and isinstance(data.get("output"), dict):
        data = data["output"]
    if not isinstance(data, dict):
        raise ValueError("AI narrative is not a JSON object")
    return data


def normalize_narrative(data: dict, fallback: dict) -> dict:
    """Coerce an AI narrative into the canonical shape, filling gaps with the
    deterministic fallback so every field is always present and valid."""
    channels = dict(fallback["channels"])
    raw_channels = data.get("channels") or {}
    if not isinstance(raw_channels, dict):
        raw_channels = {}
    for key, value in raw_channels.items():
        if isinstance(value, dict):
            value = value.get("body") or value.get("text") or value.get("summary")
        text = _coerce_str(value)
        if not text:
            continue
        channel = _RAW_TO_CHANNEL.get(key, key)
        if channel in channels:
            channels[channel] = text

    return {
        "summary": _coerce_str(data.get("summary")) or fallback["summary"],
        "channels": channels,
        "somatic_body": _coerce_str(data.get("somatic_body")) or fallback["somatic_body"],
        "journal_prompt": _coerce_str(data.get("journal_prompt")) or fallback["journal_prompt"],
    }


def _coerce_str(value) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


# ── Deterministic fallback ────────────────────────────────────────────

def deterministic_narrative(payload: dict) -> dict:
    """Data-driven narrative used when no AI provider is available."""
    aligned = payload.get("aligned")
    masking_level = payload.get("masking_level")
    index = payload.get("wellness_index")
    score = payload.get("masking_score")
    disagreements = payload.get("disagreements") or []

    channels = {
        "face": _face_body(payload),
        "voice": _voice_body(payload),
        "heartbeat": _heartbeat_body(payload),
        "words": _words_body(payload),
    }

    if aligned:
        summary = (
            f"Your signals are in sync. What you showed on the surface matches what your "
            f"body reported underneath, with a wellness index of {_int(index)}. Nothing in "
            f"your facial, vocal or cardiovascular data is pulling against anything else "
            f"right now — you're carrying this moment honestly."
        )
    else:
        strength = {"severe": "significant", "mild": "noticeable"}.get(
            masking_level, "clear"
        )
        summary = (
            f"Your signals are telling different stories. On the surface you came across "
            f"composed, but your physiological data shows {strength} hidden load — a classic "
            f"masked-stress pattern (masking score {_pct(score)}). "
            f"{_divergence_phrase(disagreements)} Your body is doing more work than your "
            f"face or words let on."
        )

    return {
        "summary": summary,
        "channels": channels,
        "somatic_body": _somatic_body(payload, aligned),
        "journal_prompt": _prompt(payload, aligned),
    }


def _face_body(payload: dict) -> str:
    face = payload.get("face") or {}
    emotion = face.get("detected_emotion")
    if not emotion:
        return "No facial signal was captured this check-in, so expression could not be assessed."
    confidence = _pct(face.get("confidence"))
    return (
        f"Facial analysis read your dominant expression as {emotion}"
        + (f" at {confidence} confidence" if confidence else "")
        + ". Your visible affect leaned on this expression while you spoke."
    )


def _voice_body(payload: dict) -> str:
    voice = payload.get("voice") or {}
    tone = voice.get("voice_tone")
    vitality = voice.get("vitality")
    stress = voice.get("stress_voice")
    clauses = []
    if tone:
        clauses.append(f"a {tone} vocal tone")
    elif vitality is not None:
        clauses.append(f"moderate vocal energy (vitality {_pct(vitality)})")
    if stress is not None:
        clauses.append(f"acoustic stress at {_pct(stress)}")
    if not clauses:
        return "No voice signal was captured this check-in, so vocal acoustics could not be assessed."
    head = clauses[0]
    if len(clauses) > 1:
        head = f"{head} with " + ", ".join(clauses[1:])
    return f"Voice analysis found {head}, which colors how your words were received."


def _heartbeat_body(payload: dict) -> str:
    vitals = payload.get("heartbeat") or {}
    hr = vitals.get("hr_bpm")
    hrv = vitals.get("hrv_rmssd_ms")
    stress = vitals.get("stress_vital")
    if hr is None and hrv is None:
        return "No cardiovascular signal was captured this check-in, so heart-rate variability could not be assessed."
    parts = []
    if hr is not None:
        parts.append(f"heart rate averaged {hr:.0f} bpm")
    if hrv is not None:
        parts.append(f"HRV of {hrv:.0f} ms")
    if stress is not None:
        parts.append(f"physiological stress estimated at {_pct(stress)}")
    return "Your cardiovascular data showed " + ", ".join(parts) + " during the capture."


def _words_body(payload: dict) -> str:
    words = payload.get("words") or {}
    label = words.get("sentiment_label")
    score = words.get("sentiment_score")
    tone = words.get("emotional_tone")
    stress = words.get("stress_level")
    if not any((label, tone, stress)):
        return "No written journal entry was attached this check-in, so semantic signals could not be assessed."
    parts = []
    if label:
        parts.append(f"read {label}" + (f" (sentiment {score:+.2f})" if isinstance(score, (int, float)) else ""))
    if tone:
        parts.append(f"a {tone} emotional tone")
    if stress:
        parts.append(f"{stress} stress in the wording")
    return "Your words " + ", ".join(parts) + "."


def _divergence_phrase(disagreements: list) -> str:
    if not disagreements:
        return "Channels pulled apart even where the surface looked calm."
    top = disagreements[0]
    pair = top.get("pair", "")
    labels = [_PAIR_LABEL.get(part.strip(), part.strip()) for part in pair.split(" vs ")]
    delta = top.get("delta")
    phrase = " vs ".join(labels)
    if delta is not None and isinstance(delta, (int, float)):
        phrase += f" (Δ {delta:+.2f})"
    return f"The widest gap was between {phrase}, where the two channels disagreed most."


def _somatic_body(payload: dict, aligned: bool) -> str:
    if aligned:
        return (
            "Your nervous system and your presentation are in agreement, so the priority is "
            "maintaining this balance. A short breathing reset before deep work can keep "
            "heart-rate variability high and protect the calm you already have."
        )
    return (
        "Your nervous system is holding tension that your conscious mind is trying to "
        "override. Before heavy cognitive work, spend 60 seconds slowing your exhale to "
        "bring heart-rate variability back up — then re-measure to see the shift."
    )


def _prompt(payload: dict, aligned: bool) -> str:
    if aligned:
        return "What helped me stay honest with myself today?"
    words = payload.get("words") or {}
    if words.get("sentiment_label"):
        return "What was I really feeling when my words said one thing and my body said another?"
    return "What am I protecting by saying I'm fine?"


def _int(value) -> str:
    if not isinstance(value, (int, float)):
        return "—"
    return f"{round(value)}"


def _pct(value) -> str:
    if not isinstance(value, (int, float)):
        return ""
    return f"{value * 100:.0f}%"
