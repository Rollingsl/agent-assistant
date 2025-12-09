"""DuckDuckGo web search tool — free, no API key required."""

import warnings
warnings.filterwarnings("ignore", message=".*renamed.*ddgs.*")
from duckduckgo_search import DDGS


def web_search(query: str, max_results: int = 8) -> str:
    """Search the web via DuckDuckGo and return formatted results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))

        if not results:
            return f"No results found for: {query}"

        lines = []
        for i, r in enumerate(results, 1):
            title = r.get("title", "Untitled")
            href = r.get("href", "")
            body = r.get("body", "")
            lines.append(f"{i}. **{title}**\n   URL: {href}\n   {body}")

        return "\n\n".join(lines)

    except Exception as e:
        return f"Search error: {e}"
