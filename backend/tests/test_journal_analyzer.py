"""Tests for the journal sentiment analyzer.

Covers golden positive/neutral/negative sentences, word-boundary keyword
matching (no substring false positives), negation handling, the antiphrase
override, and sentiment-driven tone fallback.
"""

import pytest

from api.services.journal_analyzer import analyze_journal

# (expected_label, text)
GOLDEN = [
    # Neutral factual statements must stay neutral even though the polarized
    # SST-2 model gives them extreme scores.
    ("neutral", "I woke up today and went to work."),
    ("neutral", "I'm fine."),
    ("neutral", "The weather is cloudy today."),
    ("neutral", "A normal day, nothing to complain about."),
    ("neutral", "Today I felt nothing special."),
    ("positive", "I had a wonderful day, I feel amazing!"),
    ("positive", "I am feeling happy and grateful."),
    ("positive", "It was the best day ever."),
    ("positive", "Meditation keeps me calm and peaceful."),
    ("positive", "I feel hopeful about tomorrow."),
    ("negative", "I'm so sad and upset today."),
    ("negative", "This has been the worst week of my life."),
    ("negative", "I hate this, it's terrible."),
]


@pytest.mark.parametrize("expected,text", GOLDEN)
def test_golden_sentiment(expected, text):
    assert analyze_journal(text)["sentiment_label"] == expected


# (text) sentences that must NOT trip keyword substrings like pain/painting,
# bad/badminton, tired/tiresome.
WORD_BOUNDARY = [
    "I was painting all day.",
    "I played badminton and chess.",
    "It was a tiresome journey.",
]


@pytest.mark.parametrize("text", WORD_BOUNDARY)
def test_no_substring_false_positives(text):
    assert analyze_journal(text)["sentiment_label"] == "neutral"


# (expected_label, text)
NEGATION = [
    ("negative", "I don't feel good today."),
    ("negative", "I'm not happy at all."),
    ("negative", "I am not feeling well, today was bad."),
    ("neutral", "I am not sad, but not happy either."),
    ("positive", "I don't feel sad anymore, I'm relieved."),
    ("neutral", "I'm not stressed, it's fine."),
    # Antiphrasis: "couldn't be happier" is maximally positive despite the
    # negation (and the model itself scores the contraction form negative).
    ("positive", "I could not be happier today."),
    ("positive", "I couldn't be happier."),
]


@pytest.mark.parametrize("expected,text", NEGATION)
def test_negation(expected, text):
    assert analyze_journal(text)["sentiment_label"] == expected


def test_negated_stress_not_counted():
    result = analyze_journal("I'm not stressed, it's fine.")
    assert result["stress_level"] == "low"


def test_stress_keywords_raise_level():
    result = analyze_journal("I feel stressed and overwhelmed by the deadline.")
    assert result["stress_level"] == "high"
    assert result["emotional_tone"] == "stressed"
    assert result["sentiment_label"] == "negative"


def test_tone_falls_back_to_sentiment_label():
    positive = analyze_journal("It was the best day ever.")
    assert positive["emotional_tone"] == "positive"

    negative = analyze_journal("This has been the worst week of my life.")
    assert negative["emotional_tone"] == "negative"


def test_output_shape():
    result = analyze_journal("I am feeling happy and grateful.")
    assert -1.0 <= result["sentiment_score"] <= 1.0
    assert isinstance(result["sentiment_score"], float)
    assert isinstance(result["key_themes"], list)
    assert result["emotional_tone"] in {"positive", "negative", "neutral", "stressed", "mildly_stressed"}
    assert result["stress_level"] in {"low", "moderate", "high"}
