import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    full_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Journal ───────────────────────────────────────────────────────────
class JournalCreate(BaseModel):
    content: str


class JournalResponse(BaseModel):
    id: uuid.UUID
    content: str
    sentiment_score: float | None
    sentiment_label: str | None
    emotional_tone: str | None
    stress_level: str | None
    key_themes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Emotion ───────────────────────────────────────────────────────────
class EmotionResponse(BaseModel):
    id: uuid.UUID
    detected_emotion: str
    confidence: float
    happy: float | None
    sad: float | None
    angry: float | None
    neutral: float | None
    fear: float | None
    surprise: float | None
    disgust: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Insights ──────────────────────────────────────────────────────────
class InsightResponse(BaseModel):
    id: uuid.UUID
    drift_status: str
    drift_score: float
    summary: str
    recommendation: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TrendData(BaseModel):
    dates: list[str]
    emotions: list[str | None]
    sentiment_scores: list[float | None]
    drift_scores: list[float]


# ── Analysis (checkin / verify) ───────────────────────────────────────
class FaceSignal(BaseModel):
    detected_emotion: str
    confidence: float
    scores: dict[str, float]
    frames_analyzed: int | None = None


class VoiceSignal(BaseModel):
    vitality: float
    voice_tone: str
    stress_voice: float
    confidence: float
    features: dict | None = None


class VitalsSignal(BaseModel):
    hr_bpm: float
    hrv_rmssd_ms: float | None = None
    hrv_sdnn_ms: float | None = None
    stress_vital: float
    confidence: float
    frames_processed: int | None = None
    duration_s: float | None = None


class TextSignal(BaseModel):
    sentiment_score: float
    sentiment_label: str
    emotional_tone: str
    stress_level: str
    key_themes: list[str] | str | None = None


class CheckinSignalSignals(BaseModel):
    face: FaceSignal | None = None
    voice: VoiceSignal | None = None
    vitals: VitalsSignal | None = None
    text: TextSignal | None = None


class SignalDisagreement(BaseModel):
    pair: str
    delta: float
    detail: str


class CheckinResponse(BaseModel):
    checkin_id: uuid.UUID
    wellness_index: float | None
    masking_level: str
    masking_score: float
    aligned: bool
    explanation: str
    signals_available: int
    signal_scores: dict[str, float | None]
    disagreements: list[SignalDisagreement]
    signals: CheckinSignalSignals
    recommendation: str


class VerifyVitals(BaseModel):
    hr_bpm: float | None = None
    hrv_rmssd_ms: float | None = None
    stress_vital: float | None = None


class VerifyResponse(BaseModel):
    checkin_id: uuid.UUID
    before: VerifyVitals
    after: VerifyVitals
    hrv_delta_ms: float | None = None
    improvement_pct: float | None = None
    improved: bool | None = None
    message: str


# ── Reports (AI narrative) ─────────────────────────────────────────────
class NarrativeChannels(BaseModel):
    face: str
    voice: str
    heartbeat: str
    words: str


class ReportNarrativeResponse(BaseModel):
    summary: str
    channels: NarrativeChannels
    somatic_body: str
    journal_prompt: str
