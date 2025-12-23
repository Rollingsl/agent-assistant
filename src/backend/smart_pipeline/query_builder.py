"""Generate targeted search queries and supplementary tool lookups from TaskAnalysis.

Produces 4-6 search queries tailored to the detected intent, plus a list of
supplementary tools to run (Wikipedia, WHOIS, tech detection, social profiles).
"""

from dataclasses import dataclass, field
from src.backend.smart_pipeline.analyzer import TaskAnalysis


@dataclass
class ToolLookup:
    """A supplementary tool to run alongside searches."""
    tool: str          # Tool name (e.g. "wikipedia_summary", "whois_lookup")
    args: dict         # Arguments for the tool
    label: str         # Human-readable label


@dataclass
class SearchStrategy:
    """Complete search strategy for a task."""
    queries: list[str]                        # 4-6 search queries
    tool_lookups: list[ToolLookup] = field(default_factory=list)
    primary_entity: str = ""                  # Main entity being researched
    report_title: str = ""                    # Suggested report title


# ─── Intent-Specific Query Templates ───
# Each template uses {entity}, {query}, {tech}, {item1}, {item2} placeholders

def _research_queries(analysis: TaskAnalysis) -> list[str]:
    entity = analysis.entities[0] if analysis.entities else analysis.raw_query
    queries = [
        f"{entity} overview background",
        f"{entity} recent news 2024 2025",
        f"{entity} key facts data",
    ]
    if analysis.technologies:
        queries.append(f"{entity} {' '.join(analysis.technologies[:2])} technology")
    else:
        queries.append(f"{entity} industry analysis")
    if analysis.domains:
        queries.append(f"site:{analysis.domains[0]} about")
    else:
        queries.append(f"{entity} official website")
    return queries


def _comparison_queries(analysis: TaskAnalysis) -> list[str]:
    items = analysis.comparison_items
    if len(items) < 2:
        # Fallback: split raw query
        items = [analysis.raw_query, "alternatives"]

    item1, item2 = items[0], items[1] if len(items) > 1 else "alternatives"
    queries = [
        f"{item1} vs {item2} comparison",
        f"{item1} pros cons review",
        f"{item2} pros cons review",
        f"{item1} vs {item2} differences features",
        f"{item1} {item2} benchmark performance",
    ]
    return queries


def _osint_queries(analysis: TaskAnalysis) -> list[str]:
    entity = analysis.entities[0] if analysis.entities else analysis.raw_query
    queries = [
        f"{entity} company information",
        f"{entity} leadership team founders",
        f"{entity} funding investors",
    ]
    if analysis.domains:
        queries.append(f'"{analysis.domains[0]}" site information')
    else:
        queries.append(f"{entity} website domain")
    queries.append(f"{entity} news announcements")
    return queries


def _howto_queries(analysis: TaskAnalysis) -> list[str]:
    query = analysis.raw_query
    queries = [
        f"how to {query} guide",
        f"{query} tutorial step by step",
        f"{query} best practices",
        f"{query} examples",
    ]
    if analysis.technologies:
        queries.append(f"{query} {analysis.technologies[0]} documentation")
    else:
        queries.append(f"{query} tips tricks")
    return queries


def _factual_queries(analysis: TaskAnalysis) -> list[str]:
    query = analysis.raw_query
    entity = analysis.entities[0] if analysis.entities else query
    queries = [
        f"{entity}",
        f"{entity} definition meaning",
        f"{entity} facts data",
        f"{entity} history background",
        f"{entity} Wikipedia",
    ]
    return queries


def _trend_queries(analysis: TaskAnalysis) -> list[str]:
    query = analysis.raw_query
    queries = [
        f"{query} trends 2025 2026",
        f"{query} market forecast growth",
        f"{query} industry report",
        f"{query} emerging developments",
        f"{query} future predictions outlook",
    ]
    return queries


def _technical_queries(analysis: TaskAnalysis) -> list[str]:
    entity = analysis.entities[0] if analysis.entities else analysis.raw_query
    techs = " ".join(analysis.technologies[:2]) if analysis.technologies else ""
    queries = [
        f"{entity} {techs} architecture".strip(),
        f"{entity} tech stack technology",
        f"{entity} documentation API",
        f"{entity} performance benchmark",
    ]
    if analysis.domains:
        queries.append(f"{analysis.domains[0]} technology stack builtwith")
    else:
        queries.append(f"{entity} implementation guide")
    return queries


def _news_queries(analysis: TaskAnalysis) -> list[str]:
    entity = analysis.entities[0] if analysis.entities else analysis.raw_query
    queries = [
        f"{entity} latest news",
        f"{entity} news today 2025 2026",
        f"{entity} announcements updates",
        f"{entity} press release",
        f"{entity} breaking news recent",
    ]
    return queries


def _profile_queries(analysis: TaskAnalysis) -> list[str]:
    entity = analysis.entities[0] if analysis.entities else analysis.raw_query
    queries = [
        f"{entity} biography background",
        f"{entity} career history",
        f"{entity} LinkedIn profile",
        f"{entity} interviews quotes",
        f"{entity} achievements awards",
    ]
    return queries


_QUERY_BUILDERS = {
    "RESEARCH": _research_queries,
    "COMPARISON": _comparison_queries,
    "OSINT": _osint_queries,
    "HOWTO": _howto_queries,
    "FACTUAL": _factual_queries,
    "TREND": _trend_queries,
    "TECHNICAL": _technical_queries,
    "NEWS": _news_queries,
    "PROFILE": _profile_queries,
}


def _build_tool_lookups(analysis: TaskAnalysis) -> list[ToolLookup]:
    """Determine which supplementary tools to run based on the analysis."""
    lookups: list[ToolLookup] = []

    # Wikipedia for main entities
    entities_for_wiki = analysis.entities[:2] or ([analysis.raw_query] if analysis.raw_query else [])
    for entity in entities_for_wiki:
        lookups.append(ToolLookup(
            tool="wikipedia_summary",
            args={"topic": entity},
            label=f"Wikipedia: {entity}",
        ))

    # WHOIS for domains
    for domain in analysis.domains[:2]:
        lookups.append(ToolLookup(
            tool="whois_lookup",
            args={"domain": domain},
            label=f"WHOIS: {domain}",
        ))

    # Tech detection for domains/URLs
    if analysis.intent in ("TECHNICAL", "OSINT", "RESEARCH"):
        for domain in analysis.domains[:1]:
            lookups.append(ToolLookup(
                tool="detect_tech_stack",
                args={"url": f"https://{domain}"},
                label=f"Tech stack: {domain}",
            ))
        for url in analysis.urls[:1]:
            lookups.append(ToolLookup(
                tool="detect_tech_stack",
                args={"url": url},
                label=f"Tech stack: {url[:40]}",
            ))

    # Social profiles for people/companies
    if analysis.intent in ("PROFILE", "OSINT", "RESEARCH"):
        for entity in analysis.entities[:2]:
            lookups.append(ToolLookup(
                tool="find_social_profiles",
                args={"name": entity},
                label=f"Social profiles: {entity}",
            ))

    return lookups


def build_search_strategy(analysis: TaskAnalysis) -> SearchStrategy:
    """Build a complete search strategy from task analysis."""
    builder = _QUERY_BUILDERS.get(analysis.intent, _research_queries)
    queries = builder(analysis)

    # Ensure 4-6 queries
    if len(queries) < 4:
        queries.append(f"{analysis.raw_query} information")
    queries = queries[:6]

    tool_lookups = _build_tool_lookups(analysis)

    # Generate report title
    primary = analysis.entities[0] if analysis.entities else analysis.raw_query
    intent_labels = {
        "RESEARCH": f"Research Report: {primary}",
        "COMPARISON": f"Comparison: {' vs '.join(analysis.comparison_items[:2]) if analysis.comparison_items else primary}",
        "OSINT": f"Intelligence Report: {primary}",
        "HOWTO": f"Guide: {analysis.raw_query}",
        "FACTUAL": f"Overview: {primary}",
        "TREND": f"Trend Analysis: {primary}",
        "TECHNICAL": f"Technical Analysis: {primary}",
        "NEWS": f"News Summary: {primary}",
        "PROFILE": f"Profile: {primary}",
    }
    report_title = intent_labels.get(analysis.intent, f"Report: {primary}")

    return SearchStrategy(
        queries=queries,
        tool_lookups=tool_lookups,
        primary_entity=primary,
        report_title=report_title,
    )
