from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from api.models.emotion_log import EmotionLog
from api.models.journal_entry import JournalEntry


def detect_drift(db: Session, user_id, lookback_days: int = 14) -> dict:
    """
    Analyze recent emotion and journal data to detect emotional drift.
    Returns drift status, score, summary, and recommendation.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)

    # Fetch recent data
    emotion_logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.user_id == user_id, EmotionLog.created_at >= cutoff)
        .order_by(EmotionLog.created_at)
        .all()
    )
    journal_entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user_id, JournalEntry.created_at >= cutoff)
        .order_by(JournalEntry.created_at)
        .all()
    )

    if not emotion_logs and not journal_entries:
        return {
            "drift_status": "insufficient_data",
            "drift_score": 0.0,
            "summary": "Not enough data to analyze emotional drift. Keep checking in!",
            "recommendation": "Try to log at least 3-5 entries over a few days for meaningful insights.",
            "emotion_trend": [],
            "journal_trend": [],
        }

    # Analyze emotion trends
    emotion_scores_over_time = []
    positive_emotions = ["happy", "surprise"]
    negative_emotions = ["sad", "angry", "fear", "disgust"]

    for log in emotion_logs:
        happy_score = (log.happy or 0) + (log.surprise or 0) * 0.5
        sad_score = (log.sad or 0) + (log.angry or 0) + (log.fear or 0) + (log.disgust or 0)
        net = happy_score - sad_score
        emotion_scores_over_time.append(net)

    # Analyze journal sentiment trends
    sentiment_scores = [e.sentiment_score or 0.0 for e in journal_entries]

    # Calculate drift score
    drift_score = 0.0

    if len(emotion_scores_over_time) >= 2:
        # Compare first half vs second half
        mid = len(emotion_scores_over_time) // 2
        first_half = sum(emotion_scores_over_time[:mid]) / mid
        second_half = sum(emotion_scores_over_time[mid:]) / (len(emotion_scores_over_time) - mid)
        emotion_drift = second_half - first_half
        drift_score += emotion_drift * 0.5

    if len(sentiment_scores) >= 2:
        mid = len(sentiment_scores) // 2
        first_half = sum(sentiment_scores[:mid]) / mid
        second_half = sum(sentiment_scores[mid:]) / (len(sentiment_scores) - mid)
        journal_drift = second_half - first_half
        drift_score += journal_drift * 0.5

    # Classify drift
    if drift_score > 0.15:
        drift_status = "improving"
    elif drift_score < -0.15:
        drift_status = "deteriorating"
    else:
        drift_status = "stable"

    # Generate summary
    recent_sentiment = sentiment_scores[-1] if sentiment_scores else 0
    recent_emotion = emotion_scores_over_time[-1] if emotion_scores_over_time else 0
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    avg_emotion = sum(emotion_scores_over_time) / len(emotion_scores_over_time) if emotion_scores_over_time else 0

    summary_parts = []

    if drift_status == "improving":
        summary_parts.append("Your emotional state appears to be improving over the past days.")
    elif drift_status == "deteriorating":
        summary_parts.append("Your emotional state shows signs of decline recently.")
    else:
        summary_parts.append("Your emotional state has been relatively stable.")

    if recent_sentiment < -0.3:
        summary_parts.append("Your latest journal entry reflects notably negative sentiment.")
    elif recent_sentiment > 0.3:
        summary_parts.append("Your latest journal entry reflects positive sentiment.")

    if recent_emotion < -0.3:
        summary_parts.append("Your recent facial expressions suggest low mood.")
    elif recent_emotion > 0.3:
        summary_parts.append("Your recent facial expressions suggest good mood.")

    # Count stress in journal entries
    stress_count = sum(1 for e in journal_entries if e.stress_level in ("high", "moderate"))
    if stress_count > len(journal_entries) * 0.5 and journal_entries:
        summary_parts.append("Stress indicators appear frequently in your journal entries.")

    summary = " ".join(summary_parts) if summary_parts else "Your emotional patterns appear consistent."

    # Generate recommendation
    recommendations = []
    if drift_status == "deteriorating":
        recommendations.append("Consider taking a break and doing something you enjoy.")
        recommendations.append("Try a short breathing exercise or meditation.")
    elif recent_sentiment < -0.3:
        recommendations.append("Journal about something you're grateful for today.")
        recommendations.append("Reach out to a friend or loved one.")
    elif stress_count > 2:
        recommendations.append("You may benefit from some rest and self-care.")
    else:
        recommendations.append("Keep up your current routine — you're doing well!")

    recommendation = " ".join(recommendations) if recommendations else "Keep checking in to build your emotional profile."

    return {
        "drift_status": drift_status,
        "drift_score": round(drift_score, 4),
        "summary": summary,
        "recommendation": recommendation,
        "emotion_trend": emotion_scores_over_time[-7:],
        "journal_trend": sentiment_scores[-7:],
    }
