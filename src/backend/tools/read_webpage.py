"""Fetch a URL and extract clean readable text using Scrapling.

Uses Scrapling's Fetcher with browser TLS fingerprint impersonation
and stealthy headers — bypasses most anti-bot systems without a real browser.
"""

import logging
import os

# Suppress Scrapling's INFO logging for cleaner output
logging.getLogger("scrapling").setLevel(logging.WARNING)
# Set Scrapling to use English locale for better search results
os.environ.setdefault("SCRAPLING_LOCALE", "en-US")

from scrapling.fetchers import Fetcher


def read_webpage(url: str, max_chars: int = 12000) -> str:
    """Fetch a webpage using Scrapling and return clean text content."""
    try:
        page = Fetcher.get(url, stealthy_headers=True, timeout=20)

        if page.status >= 400:
            return f"Failed to read webpage: HTTP {page.status} for {url}"

        # Extract text from main content areas, excluding noise
        # Try specific content selectors first (article, main, #content)
        content_text = ""

        for selector in ["article", "main", "[role='main']", "#content", ".content", ".post-content", ".entry-content"]:
            elements = page.css(selector)
            if elements:
                # Get all text nodes from the content area
                texts = []
                for el in elements:
                    el_texts = el.css("*::text").getall()
                    texts.extend(el_texts)
                content_text = "\n".join(t.strip() for t in texts if t.strip())
                if len(content_text) > 200:
                    break

        # Fallback: get all body text, but exclude scripts/styles/nav/footer
        if len(content_text) < 200:
            # Get all text nodes from body
            all_texts = page.css("body *::text").getall()
            content_text = "\n".join(t.strip() for t in all_texts if t.strip())

        # Clean up
        if not content_text:
            return "Page fetched but no readable text found."

        # Remove duplicate lines and excessive whitespace
        seen = set()
        lines = []
        for line in content_text.split("\n"):
            line = line.strip()
            if line and line not in seen:
                seen.add(line)
                lines.append(line)

        clean = "\n".join(lines)

        if len(clean) > max_chars:
            clean = clean[:max_chars] + "\n\n[...truncated]"

        return clean

    except Exception as e:
        return f"Failed to read webpage: {e}"


def scrape_page(url: str, css_selector: str = "", max_chars: int = 12000) -> str:
    """Fetch a webpage and extract content matching a CSS selector.

    If no selector given, extracts the full page text.
    Uses Scrapling with browser fingerprint impersonation.

    Supports pseudo-elements like '::text' and '::attr(href)'.
    Examples: '.product h2::text', 'a::attr(href)', '.price'
    """
    try:
        page = Fetcher.get(url, stealthy_headers=True, timeout=20)

        if page.status >= 400:
            return f"Failed to fetch: HTTP {page.status} for {url}"

        if not css_selector:
            return read_webpage(url, max_chars)

        # If selector contains pseudo-elements (::text, ::attr), use getall() directly
        if "::" in css_selector:
            results = page.css(css_selector).getall()
            if not results:
                return f"No results for '{css_selector}' on {url}"
            output = "\n".join(r.strip() for r in results if r.strip())
        else:
            # Select elements, then extract their text
            elements = page.css(css_selector)
            if not elements:
                return f"No elements matching '{css_selector}' on {url}"

            results = []
            for el in elements:
                text = " ".join(el.css("::text").getall()).strip()
                if text:
                    results.append(text)

            if not results:
                return f"Elements found but no text content for '{css_selector}'"

            output = "\n---\n".join(results)

        if len(output) > max_chars:
            output = output[:max_chars] + "\n\n[...truncated]"

        return output

    except Exception as e:
        return f"Failed to scrape: {e}"
