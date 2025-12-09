"""Fetch a URL and extract clean readable text."""

import requests
from bs4 import BeautifulSoup


def read_webpage(url: str, max_chars: int = 12000) -> str:
    """Fetch a webpage and return its text content, truncated to max_chars."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; OPAS-Agent/1.0)"
        }
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)

        # Collapse excessive blank lines
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean = "\n".join(lines)

        if len(clean) > max_chars:
            clean = clean[:max_chars] + "\n\n[...truncated]"

        return clean if clean else "Page fetched but no readable text found."

    except Exception as e:
        return f"Failed to read webpage: {e}"
