"""Wikipedia REST API — article summaries and search. No dependencies needed."""

import urllib.request
import urllib.parse
import json


_API_BASE = "https://en.wikipedia.org/api/rest_v1"
_SEARCH_BASE = "https://en.wikipedia.org/w/api.php"


def _fetch_json(url: str, timeout: int = 10) -> dict:
    """Fetch JSON from a URL."""
    req = urllib.request.Request(url, headers={"User-Agent": "OPAS-Bot/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def wikipedia_summary(topic: str) -> str:
    """Get a Wikipedia article summary for a topic.

    Uses the Wikipedia REST API (no library needed).
    Returns the article extract with key metadata.
    """
    topic = topic.strip()
    if not topic:
        return "No topic provided."

    # URL-encode the topic
    encoded = urllib.parse.quote(topic.replace(" ", "_"))

    try:
        data = _fetch_json(f"{_API_BASE}/page/summary/{encoded}")

        title = data.get("title", topic)
        extract = data.get("extract", "")
        description = data.get("description", "")
        url = data.get("content_urls", {}).get("desktop", {}).get("page", "")

        if not extract:
            return f"No Wikipedia article found for '{topic}'."

        lines = [f"## {title}"]
        if description:
            lines.append(f"*{description}*\n")
        lines.append(extract)
        if url:
            lines.append(f"\n**Source:** {url}")

        return "\n".join(lines)

    except urllib.error.HTTPError as e:
        if e.code == 404:
            # Try search instead
            return _search_and_summarize(topic)
        return f"Wikipedia lookup failed: HTTP {e.code}"
    except Exception as e:
        return f"Wikipedia lookup failed: {e}"


def _search_and_summarize(topic: str) -> str:
    """Search Wikipedia and return the best match summary."""
    results = wikipedia_search(topic, max_results=1)
    if "No results" in results:
        return f"No Wikipedia article found for '{topic}'."
    # The search already includes summaries
    return results


def wikipedia_search(topic: str, max_results: int = 5) -> str:
    """Search Wikipedia and return top matches with snippets.

    Uses the MediaWiki Action API for search.
    """
    topic = topic.strip()
    if not topic:
        return "No topic provided."

    params = urllib.parse.urlencode({
        "action": "query",
        "list": "search",
        "srsearch": topic,
        "srlimit": max_results,
        "format": "json",
        "srprop": "snippet|size|timestamp",
    })

    try:
        data = _fetch_json(f"{_SEARCH_BASE}?{params}")
        results = data.get("query", {}).get("search", [])

        if not results:
            return f"No Wikipedia results for '{topic}'."

        lines = [f"## Wikipedia Search: {topic}\n"]
        for i, r in enumerate(results, 1):
            title = r.get("title", "")
            # Strip HTML tags from snippet
            snippet = r.get("snippet", "")
            snippet = snippet.replace('<span class="searchmatch">', "**").replace("</span>", "**")
            import re
            snippet = re.sub(r"<[^>]+>", "", snippet)

            lines.append(f"{i}. **{title}**")
            lines.append(f"   {snippet}")
            lines.append(f"   https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}")
            lines.append("")

        return "\n".join(lines)

    except Exception as e:
        return f"Wikipedia search failed: {e}"
