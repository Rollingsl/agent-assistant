"""Enhanced Scrapling-based page reader for the smart pipeline.

Extracts structured content: metadata, clean paragraphs, tables.
Includes language detection with user-preference-aware filtering.
Uses Scrapling's get_all_text(), element.text, and CSS pseudo-elements.
"""

import json
import logging
import os
import re

logging.getLogger("scrapling").setLevel(logging.WARNING)
os.environ.setdefault("SCRAPLING_LOCALE", "en-US")

from scrapling.fetchers import Fetcher


# Map user language preferences to html[lang] prefixes
LANGUAGE_TO_LANG_PREFIX = {
    "English": "en",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Japanese": "ja",
    "Chinese": "zh",
    "Portuguese": "pt",
    "Arabic": "ar",
    "Korean": "ko",
}


def _detect_language(page) -> str:
    """Detect page language from html[lang] attribute."""
    html_els = page.css("html")
    if html_els:
        lang = html_els[0].attrib.get("lang", "")
        if lang:
            return lang.lower().strip()
    return ""


def _language_matches(page_lang: str, user_language: str) -> bool:
    """Check if page language matches the user's preferred language.

    Args:
        page_lang: The html[lang] value (e.g., 'en', 'de', 'zh-CN')
        user_language: The user preference string (e.g., 'English', 'German')
    """
    if not page_lang:
        return True  # No lang attribute — don't filter

    expected_prefix = LANGUAGE_TO_LANG_PREFIX.get(user_language, "en")
    return page_lang.startswith(expected_prefix)


def _extract_metadata(page) -> dict:
    """Extract structured metadata from the page using Scrapling selectors."""
    meta = {}

    # Title — use element.text for cleaner extraction
    title_els = page.css("title")
    if title_els:
        meta["title"] = title_els[0].text.strip() if title_els[0].text else ""

    # Meta description
    desc_els = page.css('meta[name="description"]')
    if desc_els:
        meta["description"] = desc_els[0].attrib.get("content", "")

    # Open Graph
    og_title = page.css('meta[property="og:title"]')
    if og_title:
        meta["og_title"] = og_title[0].attrib.get("content", "")

    og_desc = page.css('meta[property="og:description"]')
    if og_desc:
        meta["og_description"] = og_desc[0].attrib.get("content", "")

    # JSON-LD structured data
    jsonld_els = page.css('script[type="application/ld+json"]')
    if jsonld_els:
        for el in jsonld_els[:3]:
            text = el.text.strip() if el.text else ""
            if not text:
                continue
            try:
                data = json.loads(text)
                # Handle @graph wrapper
                if isinstance(data, dict) and "@graph" in data:
                    data = data["@graph"]
                if isinstance(data, list):
                    data = data[0] if data else {}
                if isinstance(data, dict):
                    if data.get("@type"):
                        meta["jsonld_type"] = data["@type"]
                    if data.get("name"):
                        meta["jsonld_name"] = str(data["name"])[:200]
                    if data.get("description"):
                        meta["jsonld_description"] = str(data["description"])[:300]
                    break  # Use first valid JSON-LD block
            except (json.JSONDecodeError, KeyError, IndexError, TypeError):
                continue

    return {k: v for k, v in meta.items() if v}  # Remove empty values


def _extract_paragraphs(page, max_chars: int = 8000) -> str:
    """Extract clean paragraph text using Scrapling's get_all_text().

    Uses structured CSS selectors targeting content areas,
    with get_all_text(separator=' ', strip=True) for clean output.
    """
    # Priority-ordered content selectors
    content_selectors = [
        "article", "main", "[role='main']", "#content",
        "#mw-content-text",  # Wikipedia
        ".content", ".post-content", ".entry-content",
    ]

    # Try to find a content container and extract paragraphs from it
    for container_sel in content_selectors:
        containers = page.css(container_sel)
        if not containers:
            continue

        paragraphs = []
        seen = set()
        total_len = 0

        # Get paragraphs from within the content container
        for container in containers[:2]:  # Max 2 content areas
            p_elements = container.css("p")
            for el in p_elements:
                # Use get_all_text for clean text extraction
                text = el.get_all_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text).strip()

                if len(text) < 30 or text in seen:
                    continue
                seen.add(text)
                paragraphs.append(text)
                total_len += len(text)
                if total_len >= max_chars:
                    break
            if total_len >= max_chars:
                break

        if total_len >= 200:
            return "\n\n".join(paragraphs)

    # Fallback: all paragraphs on the page
    paragraphs = []
    seen = set()
    total_len = 0

    for el in page.css("p"):
        text = el.get_all_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text).strip()
        if len(text) < 30 or text in seen:
            continue
        seen.add(text)
        paragraphs.append(text)
        total_len += len(text)
        if total_len >= max_chars:
            break

    # Last resort: use page-level get_all_text
    if total_len < 200:
        body = page.css("body")
        if body:
            full_text = body[0].get_all_text(separator='\n', strip=True)
            # Split into lines and filter
            for line in full_text.split('\n'):
                line = line.strip()
                if len(line) < 30 or line in seen:
                    continue
                seen.add(line)
                paragraphs.append(line)
                total_len += len(line)
                if total_len >= max_chars:
                    break

    return "\n\n".join(paragraphs)


def _extract_tables(page, max_tables: int = 3) -> str:
    """Extract tables as markdown if they contain meaningful data."""
    tables = page.css("table")
    if not tables:
        return ""

    md_tables = []
    for table in tables[:max_tables]:
        rows = table.css("tr")
        if len(rows) < 2:
            continue

        table_data = []
        for row in rows:
            cells = row.css("th, td")
            cell_texts = []
            for cell in cells:
                # Use get_all_text for clean cell content
                text = cell.get_all_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text)
                cell_texts.append(text)
            if any(cell_texts):
                table_data.append(cell_texts)

        if len(table_data) < 2:
            continue

        # Build markdown table
        header = table_data[0]
        if not any(header):
            continue

        md = "| " + " | ".join(header) + " |"
        md += "\n| " + " | ".join("---" for _ in header) + " |"
        for row_data in table_data[1:]:
            padded = row_data + [""] * (len(header) - len(row_data))
            md += "\n| " + " | ".join(padded[:len(header)]) + " |"
        md_tables.append(md)

    return "\n\n".join(md_tables)


def smart_read_page(url: str, max_chars: int = 8000, user_language: str = "English") -> str:
    """Fetch a page and return structured content with metadata.

    Filters pages that don't match the user's preferred language.
    Extracts metadata, clean paragraphs, and tables in structured format.

    Args:
        url: The URL to fetch
        max_chars: Maximum characters of content to return
        user_language: User's preferred language from preferences (e.g., 'English', 'German')
    """
    try:
        page = Fetcher.get(url, stealthy_headers=True, timeout=20)

        if page.status >= 400:
            return f"Failed to read: HTTP {page.status} for {url}"

        # Language detection — skip pages that don't match user preference
        page_lang = _detect_language(page)
        if not _language_matches(page_lang, user_language):
            return f"[SKIPPED] Language mismatch (page={page_lang}, wanted={user_language}): {url}"

        # Extract metadata
        meta = _extract_metadata(page)

        # Extract paragraphs using Scrapling's get_all_text
        paragraphs = _extract_paragraphs(page, max_chars=max_chars)

        # Extract tables
        tables = _extract_tables(page)

        # Build structured output
        parts = []

        if meta:
            parts.append("## Metadata")
            if meta.get("title"):
                parts.append(f"**Title:** {meta['title']}")
            if meta.get("description"):
                parts.append(f"**Description:** {meta['description']}")
            if meta.get("og_title") and meta.get("og_title") != meta.get("title"):
                parts.append(f"**OG Title:** {meta['og_title']}")
            if meta.get("og_description") and meta.get("og_description") != meta.get("description"):
                parts.append(f"**OG Description:** {meta['og_description']}")
            if meta.get("jsonld_type"):
                parts.append(f"**Type:** {meta['jsonld_type']}")
            if meta.get("jsonld_name"):
                parts.append(f"**Name:** {meta['jsonld_name']}")
            if meta.get("jsonld_description"):
                parts.append(f"**Structured Description:** {meta['jsonld_description']}")
            parts.append("")

        if paragraphs:
            parts.append("## Content")
            parts.append(paragraphs)
            parts.append("")

        if tables:
            parts.append("## Tables")
            parts.append(tables)
            parts.append("")

        output = "\n".join(parts).strip()
        if not output:
            return "Page fetched but no structured content extracted."

        if len(output) > max_chars:
            output = output[:max_chars] + "\n\n[...truncated]"

        return output

    except Exception as e:
        return f"Failed to read page: {e}"
