"""Content synthesizer — sentence-level relevance scoring, dedup, section assignment.

Takes raw scraped content + task analysis, returns ranked & organized facts.
Zero LLM tokens.
"""

import re
from dataclasses import dataclass, field
from src.backend.smart_pipeline.analyzer import TaskAnalysis


@dataclass
class ScoredFact:
    """A single scored sentence/fact."""
    text: str
    score: float
    source_url: str = ""
    section: str = "General"


@dataclass
class SynthesisResult:
    """Organized facts grouped by section."""
    sections: dict[str, list[ScoredFact]] = field(default_factory=dict)
    total_facts: int = 0
    sources: list[str] = field(default_factory=list)


# Section assignment keyword signals
SECTION_SIGNALS: dict[str, list[str]] = {
    "Overview": ["founded", "headquartered", "based in", "is a company", "is an",
                 "was established", "incorporated", "is a leading", "provides"],
    "Recent Developments": ["announced", "launched", "released", "acquired",
                            "partnership", "updated", "2024", "2025", "2026",
                            "recently", "this year", "last month", "today"],
    "Financial Data": ["revenue", "profit", "valuation", "funding", "raised",
                       "million", "billion", "ipo", "market cap", "investment",
                       "$", "€", "£", "quarterly", "annual revenue"],
    "Technology": ["tech stack", "built with", "architecture", "api", "framework",
                   "platform", "infrastructure", "cloud", "database", "software",
                   "deployed", "stack", "open source"],
    "Leadership": ["ceo", "cto", "founder", "co-founder", "president", "director",
                   "executive", "board", "management", "leadership", "chief"],
    "Competition": ["competitor", "rival", "alternative", "versus", "compared to",
                    "market share", "vs", "better than", "advantage", "disadvantage"],
    "Products & Services": ["product", "service", "offering", "feature", "solution",
                            "tool", "suite", "plan", "pricing", "subscription"],
    "How-To Steps": ["step 1", "step 2", "first,", "then,", "next,", "finally,",
                     "install", "configure", "setup", "run the", "execute",
                     "create a", "open the", "click on", "navigate to"],
}

# Statistics/numbers pattern
STATS_RE = re.compile(r'\d+(?:\.\d+)?(?:\s*[%$€£BMKbmk]|\s*(?:million|billion|thousand|percent))', re.IGNORECASE)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences, filtering noise."""
    # Split on sentence boundaries
    raw = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    sentences = []
    for s in raw:
        s = s.strip()
        # Filter out noise: too short, too long, or clearly navigation/boilerplate
        if len(s) < 20 or len(s) > 500:
            continue
        # Skip cookie notices, navigation items, etc.
        noise_patterns = [
            r'^(cookie|accept|privacy|subscribe|sign up|log in|menu|nav)',
            r'^(click here|read more|see also|related|share|tweet|pin)',
            r'^\d+\s*(comments?|shares?|likes?|views?)',
        ]
        if any(re.match(p, s, re.IGNORECASE) for p in noise_patterns):
            continue
        sentences.append(s)

    return sentences


def _score_sentence(sentence: str, analysis: TaskAnalysis) -> float:
    """Score a sentence for relevance to the task."""
    score = 0.0
    s_lower = sentence.lower()

    # +2 for entity mentions
    for entity in analysis.entities:
        if entity.lower() in s_lower:
            score += 2.0

    # +2 for domain mentions
    for domain in analysis.domains:
        if domain.lower() in s_lower:
            score += 2.0

    # +1 for keyword matches
    for kw in analysis.keywords[:10]:
        if kw in s_lower:
            score += 1.0

    # +1 for technology mentions
    for tech in analysis.technologies:
        if tech.lower() in s_lower:
            score += 1.0

    # +0.5 for statistics/numbers
    if STATS_RE.search(sentence):
        score += 0.5

    # +0.5 for comparison items
    for item in analysis.comparison_items:
        if item.lower() in s_lower:
            score += 1.5

    # Small bonus for longer, more informative sentences
    if len(sentence) > 80:
        score += 0.2

    return score


def _jaccard_similarity(s1: str, s2: str) -> float:
    """Word-level Jaccard similarity between two strings."""
    words1 = set(s1.lower().split())
    words2 = set(s2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)


def _deduplicate(facts: list[ScoredFact], threshold: float = 0.6) -> list[ScoredFact]:
    """Remove near-duplicate facts using Jaccard word overlap."""
    if not facts:
        return []

    unique: list[ScoredFact] = [facts[0]]
    for fact in facts[1:]:
        is_dup = False
        for existing in unique:
            if _jaccard_similarity(fact.text, existing.text) > threshold:
                is_dup = True
                # Keep the higher-scored version
                if fact.score > existing.score:
                    unique.remove(existing)
                    unique.append(fact)
                break
        if not is_dup:
            unique.append(fact)

    return unique


def _assign_section(sentence: str) -> str:
    """Assign a sentence to a report section based on keyword signals."""
    s_lower = sentence.lower()
    best_section = "General"
    best_count = 0

    for section, keywords in SECTION_SIGNALS.items():
        count = sum(1 for kw in keywords if kw in s_lower)
        if count > best_count:
            best_count = count
            best_section = section

    return best_section


def synthesize(
    content_items: list[tuple[str, str]],  # (source_url, content_text)
    analysis: TaskAnalysis,
    max_facts: int = 50,
) -> SynthesisResult:
    """Synthesize scraped content into scored, organized facts.

    Args:
        content_items: List of (source_url, content_text) tuples
        analysis: TaskAnalysis from the analyzer
        max_facts: Maximum number of facts to include

    Returns:
        SynthesisResult with sections containing scored facts
    """
    all_facts: list[ScoredFact] = []
    sources: list[str] = []

    for source_url, content in content_items:
        if source_url and source_url not in sources:
            sources.append(source_url)

        sentences = _split_sentences(content)
        for sentence in sentences:
            score = _score_sentence(sentence, analysis)
            if score > 0:  # Only keep relevant sentences
                section = _assign_section(sentence)
                all_facts.append(ScoredFact(
                    text=sentence,
                    score=score,
                    source_url=source_url,
                    section=section,
                ))

    # Sort by score descending
    all_facts.sort(key=lambda f: f.score, reverse=True)

    # Take top facts
    all_facts = all_facts[:max_facts * 2]  # Over-select before dedup

    # Deduplicate
    all_facts = _deduplicate(all_facts)

    # Trim to max
    all_facts = all_facts[:max_facts]

    # Group by section
    sections: dict[str, list[ScoredFact]] = {}
    for fact in all_facts:
        if fact.section not in sections:
            sections[fact.section] = []
        sections[fact.section].append(fact)

    return SynthesisResult(
        sections=sections,
        total_facts=len(all_facts),
        sources=sources,
    )
