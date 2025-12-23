"""Task classification & entity extraction using keyword/regex heuristics.

Zero LLM tokens — purely algorithmic intent detection and entity extraction.
"""

import re
from dataclasses import dataclass, field


# ─── Intent Definitions ───
# Each intent has weighted regex patterns. Highest total score wins.

INTENT_PATTERNS: dict[str, list[tuple[str, float]]] = {
    "RESEARCH": [
        (r"\bresearch\b", 3.0),
        (r"\binvestigat[ei]", 2.5),
        (r"\banalyz[ei]", 2.0),
        (r"\bstudy\b", 2.0),
        (r"\bexplor[ei]", 1.5),
        (r"\bfind out\b", 1.5),
        (r"\breport on\b", 2.0),
        (r"\bdeep dive\b", 2.0),
        (r"\boverview\b", 1.5),
    ],
    "COMPARISON": [
        (r"\bvs\.?\b", 4.0),
        (r"\bversus\b", 4.0),
        (r"\bcompar[ei]", 3.5),
        (r"\bdifference[s]? between\b", 3.0),
        (r"\bbetter than\b", 2.0),
        (r"\balternatives? to\b", 2.5),
        (r"\bpros and cons\b", 3.0),
        (r"\bwhich is\b", 1.5),
    ],
    "OSINT": [
        (r"\bosint\b", 4.0),
        (r"\bintelligence\b", 2.0),
        (r"\bbackground check\b", 3.0),
        (r"\bwho owns\b", 3.0),
        (r"\bwhois\b", 3.5),
        (r"\bdomain\b.*\binfo\b", 2.5),
        (r"\bregistr", 2.0),
        (r"\bfootprint\b", 2.5),
        (r"\brecon\b", 2.5),
    ],
    "HOWTO": [
        (r"\bhow to\b", 4.0),
        (r"\bhow do[es]?\b", 3.0),
        (r"\bstep[- ]by[- ]step\b", 3.0),
        (r"\btutorial\b", 3.0),
        (r"\bguide\b", 2.5),
        (r"\bsetup\b", 2.0),
        (r"\binstall\b", 2.0),
        (r"\bdeploy\b", 2.0),
        (r"\bconfigur[ei]", 2.0),
        (r"\bimplement\b", 1.5),
    ],
    "FACTUAL": [
        (r"\bwhat is\b", 3.0),
        (r"\bwhat are\b", 3.0),
        (r"\bdefin[ei]", 2.5),
        (r"\bexplain\b", 2.5),
        (r"\bwho is\b", 3.0),
        (r"\bwho was\b", 3.0),
        (r"\bwhen did\b", 2.5),
        (r"\bwhere is\b", 2.0),
        (r"\bmeaning of\b", 2.0),
    ],
    "TREND": [
        (r"\btrend[s]?\b", 3.0),
        (r"\bforecast\b", 3.0),
        (r"\bprediction[s]?\b", 2.5),
        (r"\boutlook\b", 2.5),
        (r"\bfuture of\b", 3.0),
        (r"\bmarket\b.*\b(size|growth)\b", 2.5),
        (r"\bemerging\b", 2.0),
        (r"\b2024\b|\b2025\b|\b2026\b", 1.5),
    ],
    "TECHNICAL": [
        (r"\btech stack\b", 3.5),
        (r"\barchitectur[ei]", 3.0),
        (r"\bapi\b", 2.0),
        (r"\bframework\b", 2.0),
        (r"\bperformanc[ei]", 2.0),
        (r"\bbenchmark\b", 2.5),
        (r"\bscalabil", 2.0),
        (r"\binfrastructur[ei]", 2.0),
        (r"\bstack\b", 1.5),
    ],
    "NEWS": [
        (r"\bnews\b", 3.0),
        (r"\blatest\b", 2.5),
        (r"\brecent\b", 2.0),
        (r"\bbreaking\b", 3.0),
        (r"\bannounce", 2.0),
        (r"\bupdate[s]?\b", 1.5),
        (r"\btoday\b", 2.0),
        (r"\bthis week\b", 2.0),
    ],
    "PROFILE": [
        (r"\bprofile\b", 3.0),
        (r"\bbio(graphy)?\b", 3.0),
        (r"\bwho is\b", 2.5),
        (r"\bbackground\b", 2.0),
        (r"\bfounder\b", 2.0),
        (r"\bceo\b", 2.0),
        (r"\bcareer\b", 2.0),
        (r"\blinkedin\b", 2.0),
    ],
}

# ─── Technology Keywords (curated list for entity extraction) ───
TECH_KEYWORDS = {
    # Languages
    "python", "javascript", "typescript", "java", "rust", "go", "golang", "ruby",
    "php", "swift", "kotlin", "c++", "c#", "scala", "elixir", "haskell", "lua",
    # Frontend
    "react", "vue", "angular", "svelte", "nextjs", "next.js", "nuxt", "gatsby",
    "tailwind", "bootstrap", "jquery", "webpack", "vite", "remix",
    # Backend
    "node", "nodejs", "node.js", "express", "fastapi", "django", "flask", "rails",
    "spring", "laravel", "gin", "fiber", "actix", "nestjs",
    # Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "dynamodb", "cassandra", "sqlite", "supabase", "firebase", "neo4j",
    # Cloud / Infra
    "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform",
    "vercel", "netlify", "heroku", "cloudflare", "nginx", "apache",
    # AI/ML
    "openai", "gpt", "chatgpt", "claude", "anthropic", "llama", "mistral",
    "langchain", "hugging face", "huggingface", "tensorflow", "pytorch",
    "stable diffusion", "midjourney", "gemini",
    # Tools / Platforms
    "github", "gitlab", "bitbucket", "jira", "confluence", "slack", "notion",
    "figma", "stripe", "twilio", "sendgrid", "datadog", "grafana",
    "wordpress", "shopify", "salesforce", "hubspot",
    # Protocols / Concepts
    "graphql", "rest", "grpc", "websocket", "oauth", "jwt", "ssl", "tls",
    "microservices", "serverless", "blockchain", "web3", "nft", "defi",
    "machine learning", "deep learning", "neural network", "llm",
    "saas", "paas", "iaas", "ci/cd", "devops", "mlops",
}

# Domain pattern
DOMAIN_RE = re.compile(
    r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+"
    r"(?:com|org|net|io|ai|co|dev|app|xyz|me|info|biz|tech|cloud|gg|tv)\b",
    re.IGNORECASE,
)

# URL pattern
URL_RE = re.compile(r"https?://[^\s,\)\]\"']+", re.IGNORECASE)

# Title Case name pattern (2-4 capitalized words)
NAME_RE = re.compile(r"\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b")

# Comparison splitter
COMPARISON_RE = re.compile(r"\s+(?:vs\.?|versus|compared? (?:to|with)|or)\s+", re.IGNORECASE)


@dataclass
class TaskAnalysis:
    """Result of algorithmic task analysis."""
    intent: str                          # Primary intent (e.g. "RESEARCH")
    intent_scores: dict[str, float]      # All intent scores
    confidence: float                    # 0.0-1.0 confidence in primary intent
    entities: list[str] = field(default_factory=list)     # Extracted entity names
    domains: list[str] = field(default_factory=list)      # Extracted domain names
    urls: list[str] = field(default_factory=list)         # Extracted URLs
    technologies: list[str] = field(default_factory=list) # Detected tech keywords
    comparison_items: list[str] = field(default_factory=list)  # Items being compared
    keywords: list[str] = field(default_factory=list)     # Important keywords from task
    raw_query: str = ""                  # Cleaned core query


def classify_intent(text: str) -> tuple[str, dict[str, float], float]:
    """Score text against all intent patterns, return (best_intent, all_scores, confidence)."""
    text_lower = text.lower()
    scores: dict[str, float] = {}

    for intent, patterns in INTENT_PATTERNS.items():
        total = 0.0
        for pattern, weight in patterns:
            if re.search(pattern, text_lower):
                total += weight
        scores[intent] = total

    if not any(scores.values()):
        return "RESEARCH", scores, 0.1  # Default fallback

    best = max(scores, key=scores.get)  # type: ignore
    best_score = scores[best]

    # Confidence = ratio of best score to sum of all scores
    total_score = sum(scores.values())
    confidence = best_score / total_score if total_score > 0 else 0.1

    return best, scores, min(confidence, 1.0)


def extract_entities(text: str) -> list[str]:
    """Extract likely entity names (companies, people) from text."""
    entities = []

    # Title Case names (filter out common English words)
    stop_words = {
        "The", "This", "That", "These", "Those", "What", "Which", "Where",
        "When", "How", "Who", "Why", "Research", "Compare", "Find", "Create",
        "Write", "Build", "Design", "Analyze", "Search", "Look", "Draft",
        "About", "With", "From", "Into", "Using", "Between", "After", "Before",
        "And", "But", "For", "Not", "All", "Can", "Has", "Her", "His",
        "Its", "May", "New", "Now", "Old", "Our", "Out", "Own", "Say",
        "She", "Too", "Use", "Could", "Would", "Should", "Does", "Inc",
        "Recent", "Latest", "Market", "Industry", "Company", "Business",
        "Technology", "Data", "Report", "Analysis", "Brief", "Summary",
        "Does", "Did", "Will", "Would", "Could", "Should", "Also",
        "Just", "Like", "Some", "Than", "Then", "What", "Who",
    }

    for match in NAME_RE.finditer(text):
        name = match.group()
        # Strip leading stop words from the match
        words = name.split()
        while words and words[0] in stop_words:
            words = words[1:]
        # Strip trailing stop words too
        while words and words[-1] in stop_words:
            words = words[:-1]
        if len(words) >= 1:
            entities.append(" ".join(words))

    # Deduplicate preserving order
    seen = set()
    unique = []
    for e in entities:
        if e.lower() not in seen:
            seen.add(e.lower())
            unique.append(e)

    return unique


def extract_domains(text: str) -> list[str]:
    """Extract domain names from text."""
    domains = list(set(DOMAIN_RE.findall(text)))
    return domains[:10]


def extract_urls(text: str) -> list[str]:
    """Extract URLs from text."""
    urls = list(set(URL_RE.findall(text)))
    return [u.rstrip(".,;:)") for u in urls[:10]]


def extract_technologies(text: str) -> list[str]:
    """Find technology keywords mentioned in text."""
    text_lower = text.lower()
    found = []
    for tech in TECH_KEYWORDS:
        # Word boundary match
        if re.search(r"\b" + re.escape(tech) + r"\b", text_lower):
            found.append(tech)
    return sorted(set(found))


def extract_comparison_items(text: str) -> list[str]:
    """Split comparison subjects (e.g., 'React vs Vue' → ['React', 'Vue'])."""
    # Find the first "vs/versus/compared to" and extract the two sides
    match = re.search(
        r'(?:compare\s+)?(.{2,40}?)\s+(?:vs\.?|versus|compared?\s+(?:to|with))\s+(.{2,40}?)(?:\s|$|[.,;:!?])',
        text,
        re.IGNORECASE,
    )
    if not match:
        parts = COMPARISON_RE.split(text)
        if len(parts) < 2:
            return []
        # Fallback: use first split
        items = []
        for part in parts[:2]:
            cleaned = part.strip().rstrip(".,;:!?")
            for prefix in ["compare", "research", "analyze", "which is better"]:
                if cleaned.lower().startswith(prefix):
                    cleaned = cleaned[len(prefix):].strip()
            if cleaned and len(cleaned) < 60:
                items.append(cleaned)
        return items

    item1 = match.group(1).strip()
    item2 = match.group(2).strip().rstrip(".,;:!?")

    # Remove leading instruction words
    for prefix in ["compare", "research", "analyze"]:
        if item1.lower().startswith(prefix):
            item1 = item1[len(prefix):].strip()

    # Stop item2 at instruction boundaries
    for stop in [" for ", " in ", " when ", " regarding "]:
        idx = item2.lower().find(stop)
        if idx > 0:
            item2 = item2[:idx]

    items = []
    if item1:
        items.append(item1)
    if item2:
        items.append(item2)

    return items


def extract_keywords(text: str) -> list[str]:
    """Extract important keywords from text (excluding stop words)."""
    stop = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "through", "during", "before", "after", "above", "below",
        "between", "out", "off", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "each",
        "every", "both", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "and", "but", "or", "if", "while", "because", "about", "up",
        "it", "its", "i", "me", "my", "we", "our", "you", "your", "he",
        "she", "they", "them", "his", "her", "this", "that", "these", "those",
        "what", "which", "who", "whom", "find", "research", "analyze",
        "search", "look", "create", "write", "build", "make", "get",
    }
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    keywords = [w for w in words if w not in stop]
    # Deduplicate preserving order
    seen = set()
    unique = []
    for w in keywords:
        if w not in seen:
            seen.add(w)
            unique.append(w)
    return unique[:20]


def _clean_query(text: str) -> str:
    """Extract core search subject from task text."""
    # Strip common instruction prefixes
    prefixes = sorted([
        "research and write a blog post about ",
        "research and write about ", "research and draft ",
        "create a market brief on ", "create a brief on ",
        "prepare briefing materials for meeting with ",
        "prepare briefing for meeting with ",
        "research target company: ", "research prospect and ",
        "research ", "analyze ", "investigate ", "compare ",
        "find information about ", "find information on ",
        "find ", "look up ", "search for ", "compile a ",
        "tell me about ", "what is ", "who is ", "how to ",
        "explain ", "create ", "write ", "draft ", "build ",
    ], key=len, reverse=True)

    cleaned = text.strip()
    for prefix in prefixes:
        if cleaned.lower().startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break

    # Stop at instruction boundaries
    stop_phrases = [
        ". ", "; ", " - ", ": ",
        ", and then", ", including", ", and ", " and produce", " and draft",
        " funding", " tech stack", " leadership", " product launches",
        " pricing", " market position", " pain points", " challenges",
        " with data", " with subject", " with citations",
    ]
    earliest_idx = len(cleaned)
    for stop in stop_phrases:
        idx = cleaned.lower().find(stop)
        if idx > 2 and idx < earliest_idx:
            earliest_idx = idx
    if earliest_idx < len(cleaned):
        cleaned = cleaned[:earliest_idx]

    return cleaned.strip().rstrip(".,;:-")[:80]


def analyze_task(title: str, description: str = "") -> TaskAnalysis:
    """Analyze a task and return structured classification + entities.

    Combines title and description for analysis but prioritizes
    description for entity extraction when available.
    """
    # If description starts with or contains the title, avoid duplication
    if description and title.lower() in description.lower():
        full_text = description.strip()
    else:
        full_text = f"{title} {description}".strip()

    intent, scores, confidence = classify_intent(full_text)
    entities = extract_entities(full_text)
    domains = extract_domains(full_text)
    urls = extract_urls(full_text)
    technologies = extract_technologies(full_text)
    comparison_items = extract_comparison_items(full_text)
    keywords = extract_keywords(full_text)
    raw_query = _clean_query(description if description else title)

    # Boost COMPARISON intent if we found comparison items
    if comparison_items and intent != "COMPARISON":
        scores["COMPARISON"] = max(scores.get("COMPARISON", 0), 5.0)
        if scores["COMPARISON"] > scores[intent]:
            intent = "COMPARISON"
            total_score = sum(scores.values())
            confidence = scores["COMPARISON"] / total_score if total_score > 0 else 0.5

    # Boost OSINT if domains found
    if domains and intent not in ("OSINT", "TECHNICAL"):
        scores["OSINT"] = scores.get("OSINT", 0) + 2.0

    return TaskAnalysis(
        intent=intent,
        intent_scores=scores,
        confidence=confidence,
        entities=entities,
        domains=domains,
        urls=urls,
        technologies=technologies,
        comparison_items=comparison_items,
        keywords=keywords,
        raw_query=raw_query,
    )
