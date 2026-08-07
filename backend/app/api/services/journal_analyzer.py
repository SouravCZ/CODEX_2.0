import re

from transformers import pipeline
from core.config import get_settings

settings = get_settings()

# Load sentiment model once at startup
_sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model=settings.JOURNAL_MODEL,
    top_k=None,
)

# Emotional tone keywords
STRESS_KEYWORDS = [
    "stress", "stressed", "anxious", "anxiously", "worried", "overwhelmed", "pressure",
    "deadline", "panic", "nervous", "tense", "exhausted", "burnout",
    "frustrated", "irritated", "angry", "angrier", "angriest", "angrily", "furious", "rage", "hate",
]

POSITIVE_KEYWORDS = [
    "happy", "happier", "happiest", "happily", "grateful", "gratefully", "thankful", "excited", "proud", "calm",
    "peaceful", "relaxed", "hopeful", "hopefully", "confident", "motivated",
    "love", "enjoy", "wonderful", "amazing", "great", "good", "better", "best",
]

NEGATIVE_KEYWORDS = [
    "sad", "sadder", "saddest", "sadly", "depressed", "lonely", "hopeless", "worthless", "empty",
    "crying", "tears", "pain", "hurt", "lost", "stuck", "tired",
    "exhausted", "drained", "miserable", "terrible", "awful", "bad", "worse", "worst",
]

_INFLECTION = r"(?:s|es|ed|ing|ly|ness|ful|er|est|ier|iest)?"

_NEGATION_WORDS = (
    r"not|never|no|hardly|barely|scarcely|without|"
    r"don't|doesn't|didn't|isn't|aren't|wasn't|weren't|"
    r"can't|cannot|won't|wouldn't|shouldn't|couldn't|ain't|n't"
)

# Antiphrases where negation does not invert sentiment ("I couldn't be happier"
# is maximally positive). Counts as two pieces of positive evidence so the
# keyword rule overrides the (negation-confused) model score.
_ANTIPHRASE_RE = re.compile(r"\bcould\s*(?:not|n't)\s*be\s+(?:any\s+)?happier\b")


def _contains_keyword(text: str, word: str) -> bool:
    """Word-boundary keyword match (with a few common inflections).

    Prevents substring false positives: "hope" no longer matches "hopeless",
    "love" no longer matches "clove", "pain" no longer matches "painting".
    """
    return re.search(rf"\b{re.escape(word)}{_INFLECTION}\b", text) is not None


def _count_keyword(text: str, word: str) -> tuple[int, int]:
    """Return (unnegated, negated) occurrence counts for a keyword.

    A keyword is treated as negated when a negation word appears within the
    three preceding words, e.g. "not happy", "don't feel good", "never sad".
    """
    unnegated = 0
    negated = 0
    for m in re.finditer(rf"\b{re.escape(word)}{_INFLECTION}\b", text):
        before = re.findall(r"[\w']+", text[: m.start()])
        window = " ".join(before[-3:])
        if re.search(rf"\b(?:{_NEGATION_WORDS})\b", window):
            negated += 1
        else:
            unnegated += 1
    return unnegated, negated


def analyze_journal(text: str) -> dict:
    """Analyze journal text for sentiment, tone, and stress."""
    result = _sentiment_pipeline(text)[0]

    # Get sentiment
    pos_score = 0.0
    neg_score = 0.0
    for item in result:
        if item["label"] == "POSITIVE":
            pos_score = item["score"]
        elif item["label"] == "NEGATIVE":
            neg_score = item["score"]

    sentiment_score = pos_score - neg_score  # Range: -1 to 1

    # Determine keyword evidence (word-boundary matched, negation-aware).
    # A negated keyword is cancelled (contributes 0 evidence) rather than
    # flipped: "not happy" isn't positive, but it isn't negative either on
    # its own — the model already encodes negation well.
    text_lower = text.lower()
    stress_count = 0
    positive_count = 0
    negative_count = 0
    negated_positive = False
    negated_negative = False
    for word in STRESS_KEYWORDS:
        stress_count += _count_keyword(text_lower, word)[0]
    for word in POSITIVE_KEYWORDS:
        unnegated, negated = _count_keyword(text_lower, word)
        positive_count += unnegated
        negated_positive = negated_positive or negated > 0
    for word in NEGATIVE_KEYWORDS:
        unnegated, negated = _count_keyword(text_lower, word)
        negative_count += unnegated
        negated_negative = negated_negative or negated > 0

    # Antiphrase override: "I couldn't be happier" is a strong positive idiom
    # even though "happier" is negated — the model itself gets confused by it.
    positive_count += 2 if _ANTIPHRASE_RE.search(text_lower) else 0

    # Sentiment label. The binary SST-2 model is very polarized — even neutral
    # statements ("the weather is cloudy") get extreme scores — so the label
    # blends model score with keyword evidence. Text with no emotional
    # keywords is treated as neutral regardless of the model's extreme score;
    # text that only contains negated keywords ("I'm not happy") is emotional,
    # so the model decides there.
    pos_evidence = positive_count
    neg_evidence = negative_count + stress_count

    if pos_evidence >= 2 and neg_evidence == 0:
        sentiment_label = "positive"
    elif neg_evidence >= 2 and pos_evidence == 0:
        sentiment_label = "negative"
    elif pos_evidence == 0 and neg_evidence == 0:
        if negated_positive and negated_negative:
            # Contradicting negations cancel out ("not sad, but not happy")
            sentiment_label = "neutral"
        elif negated_positive or negated_negative:
            # Negated emotion still leaves the sentence emotionally loaded
            if sentiment_score > 0.3:
                sentiment_label = "positive"
            elif sentiment_score < -0.3:
                sentiment_label = "negative"
            else:
                sentiment_label = "neutral"
        else:
            sentiment_label = "neutral"
    elif abs(sentiment_score) > 0.3:
        sentiment_label = "positive" if sentiment_score > 0 else "negative"
    else:
        sentiment_label = "neutral"

    if stress_count >= 2:
        emotional_tone = "stressed"
    elif negative_count >= 2:
        emotional_tone = "negative"
    elif positive_count >= 2:
        emotional_tone = "positive"
    elif stress_count == 1:
        emotional_tone = "mildly_stressed"
    elif sentiment_label == "negative":
        # Fallback: let a clear sentiment label drive the tone when there
        # isn't enough keyword evidence for a specific tone (e.g. "best day
        # ever" -> positive, "worst week of my life" -> negative).
        emotional_tone = "negative"
    elif sentiment_label == "positive":
        emotional_tone = "positive"
    else:
        emotional_tone = "neutral"

    # Stress level
    if stress_count >= 3:
        stress_level = "high"
    elif stress_count >= 1:
        stress_level = "moderate"
    else:
        stress_level = "low"

    # Key themes (simple keyword extraction)
    themes = []
    theme_map = {
        "work": ["work", "job", "office", "meeting", "deadline", "boss", "colleague"],
        "relationships": ["friend", "family", "partner", "relationship", "love", "date"],
        "health": ["health", "exercise", "sleep", "food", "diet", "doctor", "pain"],
        "mental_health": ["anxiety", "depression", "therapy", "counseling", "medication"],
        "stress": ["stress", "pressure", "overwhelmed", "deadline", "burnout"],
        "positivity": ["grateful", "happy", "excited", "proud", "motivated", "hope"],
    }

    for theme, keywords in theme_map.items():
        if any(_contains_keyword(text_lower, kw) for kw in keywords):
            themes.append(theme)

    return {
        "sentiment_score": round(sentiment_score, 4),
        "sentiment_label": sentiment_label,
        "emotional_tone": emotional_tone,
        "stress_level": stress_level,
        "key_themes": themes,
    }
