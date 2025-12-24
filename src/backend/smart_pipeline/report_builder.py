"""Structured markdown report builder with citations.

Takes SynthesisResult + metadata and generates a complete report.
"""

from src.backend.smart_pipeline.analyzer import TaskAnalysis
from src.backend.smart_pipeline.synthesizer import SynthesisResult


# Preferred section ordering
SECTION_ORDER = [
    "Overview",
    "Recent Developments",
    "Products & Services",
    "Technology",
    "Financial Data",
    "Leadership",
    "Competition",
    "How-To Steps",
    "General",
]


def build_report(
    title: str,
    analysis: TaskAnalysis,
    synthesis: SynthesisResult,
    supplementary_data: list[tuple[str, str]] | None = None,
    prefs: dict | None = None,
) -> str:
    """Build a structured markdown report from synthesized data.

    Args:
        title: Report title
        analysis: TaskAnalysis with intent/entities
        synthesis: SynthesisResult with scored facts
        supplementary_data: Optional list of (label, content) from tools
        prefs: User preferences for personalization

    Returns:
        Complete markdown report string
    """
    lines: list[str] = []

    # Title
    lines.append(f"# {title}")
    lines.append("")

    # Metadata line
    meta_parts = []
    if prefs:
        if prefs.get("full_name"):
            meta_parts.append(f"**Prepared by** {prefs['full_name']}")
        if prefs.get("company_name"):
            meta_parts.append(f"**Prepared for** {prefs['company_name']}")
    meta_parts.append(f"**Intent:** {analysis.intent}")
    if analysis.entities:
        meta_parts.append(f"**Focus:** {', '.join(analysis.entities[:3])}")
    if meta_parts:
        lines.append(" | ".join(meta_parts))
        lines.append("")

    # Summary line
    source_count = len([s for s in synthesis.sources if not s.startswith("search-")])
    lines.append(f"> Smart pipeline analysis covering {synthesis.total_facts} extracted facts from {source_count} sources.")
    lines.append("")

    # Structured metadata summary — surface JSON-LD data if present in any facts
    _add_metadata_summary(lines, synthesis)

    # Main sections from synthesis
    ordered_sections = []
    for section_name in SECTION_ORDER:
        if section_name in synthesis.sections:
            ordered_sections.append(section_name)

    # Add any sections not in the preferred order
    for section_name in synthesis.sections:
        if section_name not in ordered_sections:
            ordered_sections.append(section_name)

    for section_name in ordered_sections:
        facts = synthesis.sections[section_name]
        if not facts:
            continue

        # Cap "General" section to max 5 items
        if section_name == "General":
            facts = facts[:5]

        lines.append(f"## {section_name}")
        lines.append("")

        for fact in facts:
            # Format as bullet point with citation
            text = fact.text.rstrip(".")
            if fact.source_url and not fact.source_url.startswith("search-"):
                # Add citation as markdown link
                short_source = _shorten_url(fact.source_url)
                lines.append(f"- {text}. *([source]({fact.source_url}))*")
            else:
                lines.append(f"- {text}.")
        lines.append("")

    # Supplementary data sections
    if supplementary_data:
        for label, content in supplementary_data:
            if content and "failed" not in content.lower() and "not found" not in content.lower():
                # Don't duplicate sections that already exist
                lines.append(f"## {label}")
                lines.append("")
                # Indent content if not already markdown
                if content.startswith("## "):
                    # Strip the duplicate header
                    content = "\n".join(content.split("\n")[1:])
                lines.append(content.strip())
                lines.append("")

    # Technologies detected
    if analysis.technologies:
        lines.append("## Technologies Mentioned")
        lines.append("")
        for tech in analysis.technologies:
            lines.append(f"- {tech}")
        lines.append("")

    # Sources (hide internal search-N references)
    real_sources = [url for url in synthesis.sources if not url.startswith("search-")]
    if real_sources:
        lines.append("## Sources")
        lines.append("")
        for i, url in enumerate(real_sources, 1):
            lines.append(f"{i}. {url}")
        lines.append("")

    # Footer
    lines.append("---")
    lines.append("*Generated automatically by OPAS Smart Pipeline (zero LLM tokens used)*")

    return "\n".join(lines)


def _add_metadata_summary(lines: list[str], synthesis: SynthesisResult) -> None:
    """Add structured metadata summary from extracted page metadata."""
    import re
    metadata_facts = []
    for section_facts in synthesis.sections.values():
        for fact in section_facts:
            # Look for metadata markers from smart_read_page output
            text = fact.text
            if any(text.startswith(prefix) for prefix in ["**Title:**", "**Description:**", "**Name:**", "**Type:**", "**Structured Description:**"]):
                metadata_facts.append(text)

    if metadata_facts:
        lines.append("## Key Information")
        lines.append("")
        for mf in metadata_facts[:5]:
            lines.append(f"- {mf}")
        lines.append("")


def _shorten_url(url: str) -> str:
    """Shorten a URL for display."""
    # Remove protocol
    short = url.replace("https://", "").replace("http://", "")
    # Remove www
    short = short.replace("www.", "")
    # Truncate path
    if len(short) > 40:
        short = short[:37] + "..."
    return short
