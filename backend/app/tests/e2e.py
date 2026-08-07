"""Full backend end-to-end verification.

Hits every registered endpoint in order with real ML services (DeepFace,
DistilBERT, rPPG, voice) against the live Postgres DB. Exits non-zero on the
first failure. Run from backend/app with the venv active.
"""
import io
import json
import logging
import os
import sys
import uuid
import warnings

warnings.filterwarnings("ignore")
logging.getLogger("sqlalchemy.engine").setLevel(logging.CRITICAL)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)

PASS = 0
FAIL = 0


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}  {detail}")


def check_status(resp, expected, name):
    ok = resp.status_code == expected
    check(name, ok, f"expected {expected} got {resp.status_code}: {resp.text[:200]}")
    return ok


# ── Static ─────────────────────────────────────────────────────────────
r = client.get("/")
check_status(r, 200, "GET /")
r = client.get("/health")
check_status(r, 200, "GET /health")

# ── Auth ───────────────────────────────────────────────────────────────
uname = f"e2e_{uuid.uuid4().hex[:8]}"
r = client.post("/auth/register", json={"username": uname, "email": f"{uname}@t.com", "password": "x"})
check_status(r, 201, "POST /auth/register")
token = r.json().get("access_token")
check("register returns token", bool(token))
H = {"Authorization": f"Bearer {token}"}

r = client.post("/auth/login", json={"username": uname, "password": "x"})
check_status(r, 200, "POST /auth/login")
check("login returns token", bool(r.json().get("access_token")))

r = client.post("/auth/login", json={"username": uname, "password": "wrong"})
check_status(r, 401, "POST /auth/login wrong password")

r = client.get("/auth/me", headers=H)
check_status(r, 200, "GET /auth/me")
check("me username matches", r.json().get("username") == uname)

# ── Emotion (single-image DeepFace) ────────────────────────────────────
with open("/tmp/opencode/lena.jpg", "rb") as f:
    img = io.BytesIO(f.read())
r = client.post("/emotion/analyze", headers=H, files={"file": ("face.jpg", img, "image/jpeg")})
check_status(r, 200, "POST /emotion/analyze")
check("emotion dominant present", bool(r.json().get("detected_emotion")))

r = client.get("/emotion/history", headers=H)
check_status(r, 200, "GET /emotion/history")
check("emotion history non-empty", len(r.json()) >= 1)

# ── Journal (DistilBERT) ───────────────────────────────────────────────
r = client.post("/journal/", headers=H, json={"content": "I feel overwhelmed by work deadlines and a bit anxious about the future."})
check_status(r, 201, "POST /journal/")
check("journal sentiment present", r.json().get("sentiment_score") is not None)

r = client.get("/journal/history", headers=H)
check_status(r, 200, "GET /journal/history")
check("journal history non-empty", len(r.json()) >= 1)

# ── Insights (drift fusion) ────────────────────────────────────────────
r = client.post("/insights/generate", headers=H)
check_status(r, 200, "POST /insights/generate")
check("insight drift_status present", bool(r.json().get("drift_status")))

r = client.get("/insights/latest", headers=H)
check_status(r, 200, "GET /insights/latest")

r = client.get("/insights/trend", headers=H)
check_status(r, 200, "GET /insights/trend")
check("trend has dates", "dates" in r.json())

# ── Analysis X-ray (4-signal) ──────────────────────────────────────────
with open("/tmp/opencode/face_checkin.webm", "rb") as f:
    video = io.BytesIO(f.read())
r = client.post(
    "/analysis/checkin",
    headers=H,
    files={"video": ("checkin.webm", video, "video/webm")},
    data={"journal_text": "I am actually quite anxious about this big deadline."},
)
check_status(r, 200, "POST /analysis/checkin")
body = r.json()
sig = body.get("signals", {})
check("checkin signals_available >= 2", body.get("signals_available", 0) >= 2,
      f"got {body.get('signals_available')}")
for name in ("face", "voice", "vitals", "text"):
    check(f"checkin {name} present", sig.get(name) is not None)
check("checkin masking_level set", body.get("masking_level") in ("none", "mild", "significant"))
cid = body.get("checkin_id")
check("checkin returns checkin_id", bool(cid))

# ── Analysis verify (success path: baseline from checkin) ──────────────
with open("/tmp/opencode/face_checkin.webm", "rb") as f:
    video2 = io.BytesIO(f.read())
r = client.post(
    "/analysis/verify",
    headers=H,
    files={"video": ("after.webm", video2, "video/webm")},
    data={"checkin_id": cid},
)
check_status(r, 200, "POST /analysis/verify (success path)")
v = r.json()
check("verify returns before/after", v.get("before") and v.get("after"))
check("verify has message", bool(v.get("message")))
print(f"      verify: before hrv={v['before'].get('hrv_rmssd_ms')}, after hrv={v['after'].get('hrv_rmssd_ms')}")

r = client.post(
    "/analysis/verify",
    headers=H,
    files={"video": ("after.webm", video2, "video/webm")},
    data={"checkin_id": str(uuid.uuid4())},
)
check_status(r, 404, "POST /analysis/verify unknown checkin")

# ── Cleanup ────────────────────────────────────────────────────────────
from db.session import SessionLocal  # noqa: E402
from api.models import (  # noqa: E402
    User, EmotionLog, JournalEntry, VoiceLog, VitalsLog, IncongruenceRecord, Insight,
)
db = SessionLocal()
for u in db.query(User).filter(User.username.like("e2e%")).all():
    for m in (IncongruenceRecord, EmotionLog, JournalEntry, VoiceLog, VitalsLog, Insight):
        db.query(m).filter(m.user_id == u.id).delete(synchronize_session=False)
    db.delete(u)
db.commit()
leftover = db.query(User).count()
db.close()
print(f"\nleftover users after cleanup: {leftover}")

print(f"\nRESULT: {PASS} passed, {FAIL} failed")
raise SystemExit(1 if FAIL else 0)
