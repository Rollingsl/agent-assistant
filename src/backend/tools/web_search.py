"""DuckDuckGo web search tool — free, no API key required."""

import time
from ddgs import DDGS


def web_search(query: str, max_results: int = 8, region: str = "us-en") -> str:
    """Search the web via DuckDuckGo and return formatted results.
    Uses the specified region for locale-aware results. Retries with simpler queries if needed."""
    try:
        results = _search(query, max_results, region)

        # If no results, retry with progressively simpler query
        if not results:
            words = query.split()
            for trim in range(1, min(len(words), 4)):
                simpler = " ".join(words[:len(words) - trim])
                if len(simpler.strip()) < 3:
                    break
                time.sleep(0.5)
                results = _search(simpler, max_results, region)
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


def _search(query: str, max_results: int, region: str = "us-en") -> list:
    """Execute a single DuckDuckGo search with the specified region."""
    try:
        with DDGS() as ddgs:
            return list(ddgs.text(
                query,
                region=region,
                max_results=max_results,
            ))
    except Exception:
        return []
