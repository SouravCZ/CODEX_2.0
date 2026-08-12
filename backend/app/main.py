from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from db.session import engine, Base
from api.models import User, JournalEntry, EmotionLog, Insight, VoiceLog, VitalsLog, IncongruenceRecord  # noqa: F401
from api.routes import auth, emotion, journal, insights, analysis, reports

settings = get_settings()

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered emotional drift detection and wellness journaling API",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(emotion.router)
app.include_router(journal.router)
app.include_router(insights.router)
app.include_router(analysis.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "AI Emotional Drift Journal API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
