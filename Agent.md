# Agent Context: AI Emotional Drift Journal

## Project Overview
**AI Emotional Drift Journal** — a smart wellness companion that detects emotional patterns and behavioral deterioration over time by combining facial emotion recognition, AI journaling, memory-based behavioral analysis, and trend prediction.

**Purpose:** Hackathon prototype (not production/medical). Emphasis on innovation, UX, and strong demo.

**Pitch:** "We help users detect emotional drift before it becomes burnout."

---

## Tech Stack

| Layer    | Technology                | Status          |
|----------|---------------------------|-----------------|
| Frontend | React 19 + Vite 8         | Scaffolded      |
| Backend  | Python (FastAPI assumed)   | Scaffolded      |
| ML       | TBD                       | Empty folder    |
| DB       | TBD                       | Empty folder    |
| DevOps   | Docker Compose            | Empty file      |

---

## Directory Structure

```
CODEX_2.0/
├── Client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                # Root component (default Vite template, NOT yet customized)
│   │   ├── main.jsx
│   │   ├── components/            # UI components (all EMPTY, ready to implement)
│   │   │   ├── CameraCapture.jsx  # Webcam capture for facial emotion
│   │   │   ├── EmotionCard.jsx    # Display detected emotion
│   │   │   ├── InsightsPanel.jsx  # Show AI-generated insights
│   │   │   ├── JournalEditor.jsx  # Text journal input
│   │   │   └── TrendChart.jsx     # Mood trend visualization
│   │   ├── pages/                 # Route pages (all EMPTY)
│   │   │   ├── CheckIn.jsx        # User check-in (face + journal)
│   │   │   ├── Dashboard.jsx      # Main dashboard with trends
│   │   │   ├── Journal.jsx        # Journal history
│   │   │   └── Report.jsx         # Emotional report view
│   │   ├── services/              # API service layer (all EMPTY)
│   │   │   ├── api.js             # Base API client
│   │   │   ├── emotionService.js  # Emotion endpoints
│   │   │   └── journalService.js  # Journal endpoints
│   │   ├── utils/                 # Utilities (EMPTY)
│   │   └── assets/                # Static assets
│   ├── package.json               # React 19, Vite 8, ESLint
│   └── vite.config.js
│
├── backend/
│   └── app/
│       ├── main.py                # FastAPI entry point (EMPTY)
│       ├── requirements.txt       # Python deps (EMPTY)
│       ├── .env                   # Environment vars (EMPTY)
│       ├── api/
│       │   ├── models/            # DB models (all EMPTY)
│       │   │   ├── user.py
│       │   │   ├── journal_entry.py
│       │   │   ├── emotion_log.py
│       │   │   └── insight.py
│       │   ├── routes/            # API endpoints (all EMPTY)
│       │   │   ├── auth.py
│       │   │   ├── emotion.py
│       │   │   ├── journal.py
│       │   │   └── insights.py
│       │   ├── schemas/           # Pydantic schemas (EMPTY)
│       │   └── services/          # Business logic (all EMPTY)
│       │       ├── emotion_analyzer.py   # Facial emotion detection
│       │       ├── journal_analyzer.py   # AI journal sentiment analysis
│       │       └── drift_detector.py     # Emotional drift prediction
│       ├── core/                  # Core config (EMPTY)
│       └── db/                    # DB connection (EMPTY)
│
├── ml/                            # ML models (EMPTY, for facial recognition)
├── data/                          # Data storage (EMPTY)
├── docs/
│   └── ABOUT.md                   # Full project description
├── docker-compose.yml             # Container config (EMPTY)
├── index.js                       # Root entry (EMPTY)
└── package.json                   # Root package.json (minimal)
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `docs/ABOUT.md` | Full project description, problem statement, features, and vision |
| `Client/src/App.jsx` | Root React component — currently default Vite template, needs routing setup |
| `Client/src/pages/*` | Empty page stubs for CheckIn, Dashboard, Journal, Report |
| `Client/src/components/*` | Empty component stubs: CameraCapture, EmotionCard, InsightsPanel, JournalEditor, TrendChart |
| `Client/src/services/*` | Empty API service stubs: api.js, emotionService.js, journalService.js |
| `backend/app/main.py` | FastAPI entry point (empty) |
| `backend/app/api/routes/*` | Empty route files: auth, emotion, journal, insights |
| `backend/app/api/models/*` | Empty model files: user, journal_entry, emotion_log, insight |
| `backend/app/api/services/*` | Empty service files: emotion_analyzer, journal_analyzer, drift_detector |

---

## Core Features (Implementation Guide)

1. **Facial Emotion Recognition** — CameraCapture → backend emotion_analyzer → EmotionCard
2. **AI Journal** — JournalEditor → backend journal_analyzer → sentiment/tone detection
3. **Memory-Based Analysis** — Store past entries, compare against history via drift_detector
4. **Emotional Drift Detection** — Classify user as stable/improving/deteriorating (drift_detector.py)
5. **Personalized Insights** — Generate human-friendly wellness recommendations
6. **Dashboard & Visualization** — TrendChart, InsightsPanel for mood history and scores

---

## API Endpoints (Planned)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/auth/*` | User registration/login |
| POST | `/emotion/analyze` | Upload image, detect emotion |
| POST | `/journal/` | Submit journal entry |
| GET | `/journal/history` | Get past entries |
| GET | `/insights/` | Get emotional insights |
| GET | `/insights/trend` | Get mood trend data |

---

## Current Project Status

- **Phase:** Scaffolded — all directory structure and empty files are created
- **Implementation:** NOT started — all `.py` and `.jsx` files are empty (except `App.jsx` which is default Vite template)
- **Dependencies:** Frontend has React 19 + Vite 8 installed; backend has no `requirements.txt` content yet

---

## Development Commands

```bash
# Frontend
cd Client && npm run dev      # Start dev server
cd Client && npm run build    # Build for production
cd Client && npm run lint     # Run ESLint

# Backend
cd backend/app && pip install -r requirements.txt
cd backend/app && uvicorn main:app --reload  # (once implemented)
```

---

## When Working On This Project

- All files are empty stubs — implement from scratch
- `App.jsx` is still default Vite boilerplate — replace with React Router setup
- Backend uses Python — check `requirements.txt` before adding dependencies
- Frontend uses React 19 + Vite 8 — no TypeScript, plain JSX
- ML folder is empty — facial emotion model will need to be added (e.g., DeepFace, FER, or a custom model)
- Docker Compose file exists but is empty — not yet configured
