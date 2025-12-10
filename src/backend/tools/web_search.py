"""DuckDuckGo web search tool — free, no API key required."""

import warnings
import time
warnings.filterwarnings("ignore", message=".*renamed.*ddgs.*")
from duckduckgo_search import DDGS


def web_search(query: str, max_results: int = 8) -> str:
    """Search the web via DuckDuckGo and return formatted results.
    If the initial query returns no results, retries with progressively
    simpler queries by dropping trailing words."""
    try:
        results = _search(query, max_results)

        # If no results, retry with progressively simpler query
        if not results:
            words = query.split()
            # Try dropping the last 1-2 words each time
            for trim in range(1, min(len(words), 4)):
                simpler = " ".join(words[:len(words) - trim])
                if len(simpler.strip()) < 3:
                    break
                time.sleep(0.5)  # Rate limit courtesy
                results = _search(simpler, max_results)
                if results:
                    break

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


def _search(query: str, max_results: int) -> list:
    """Execute a single DuckDuckGo search."""
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    except Exception:
        return []
