"""Enhanced Scrapling-based page reader for the smart pipeline.

Extracts structured content: metadata, clean paragraphs, tables.
Includes language detection and early filtering of non-English pages.
"""

import logging
import os
import re

logging.getLogger("scrapling").setLevel(logging.WARNING)
os.environ.setdefault("SCRAPLING_LOCALE", "en-US")

from scrapling.fetchers import Fetcher


# Non-English TLDs to filter by default
NON_ENGLISH_TLDS = {
    ".de", ".fr", ".cn", ".jp", ".kr", ".ru", ".br",
    ".it", ".es", ".nl", ".pl", ".cz", ".tw",
}


def _detect_language(page) -> str:
    """Detect page language from html[lang] attribute."""
    html_els = page.css("html")
    if html_els:
        lang = html_els[0].attrib.get("lang", "")
        if lang:
            return lang.lower().strip()
    return ""


def _extract_metadata(page) -> dict:
    """Extract structured metadata from the page."""
    meta = {}

    # Title
    title_els = page.css("title")
    if title_els:
        title_text = title_els[0].css("::text").getall()
        if title_text:
            meta["title"] = " ".join(t.strip() for t in title_text if t.strip())

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
        import json
        for el in jsonld_els[:3]:
            raw = el.css("::text").getall()
            text = " ".join(raw).strip()
            if not text:
                continue
            try:
                data = json.loads(text)
                if isinstance(data, list):
                    data = data[0] if data else {}
                if isinstance(data, dict):
                    if data.get("@type"):
                        meta["jsonld_type"] = data["@type"]
                    if data.get("name"):
                        meta["jsonld_name"] = data["name"]
                    if data.get("description"):
                        meta["jsonld_description"] = data["description"][:300]
                    break  # Use first valid JSON-LD block
            except (json.JSONDecodeError, KeyError, IndexError):
                continue

    return meta


def _extract_paragraphs(page, max_chars: int = 8000) -> str:
    """Extract clean paragraph text from content areas."""
    selectors = [
        "article p", "main p", "#content p", ".content p",
        ".post-content p", ".entry-content p", "[role='main'] p",
    ]

    paragraphs = []
    seen = set()
    total_len = 0

    for selector in selectors:
        elements = page.css(selector)
        for el in elements:
            text_parts = el.css("::text").getall()
            text = " ".join(t.strip() for t in text_parts if t.strip())
            text = re.sub(r'\s+', ' ', text).strip()

            if len(text) < 30:
                continue
            if text in seen:
                continue
            seen.add(text)
            paragraphs.append(text)
            total_len += len(text)
            if total_len >= max_chars:
                break
        if total_len >= max_chars:
            break

    # Fallback: if paragraphs are too sparse, try broader selectors
    if total_len < 300:
        for selector in ["p", "div.text", "div.body"]:
            elements = page.css(selector)
            for el in elements:
                text_parts = el.css("::text").getall()
                text = " ".join(t.strip() for t in text_parts if t.strip())
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
                text = " ".join(cell.css("::text").getall()).strip()
                text = re.sub(r'\s+', ' ', text)
                cell_texts.append(text)
            if any(cell_texts):
                table_data.append(cell_texts)

        if len(table_data) < 2:
            continue

        # Build markdown table
        header = table_data[0]
        md = "| " + " | ".join(header) + " |"
        md += "\n| " + " | ".join("---" for _ in header) + " |"
        for row_data in table_data[1:]:
            # Pad or truncate to match header length
            padded = row_data + [""] * (len(header) - len(row_data))
            md += "\n| " + " | ".join(padded[:len(header)]) + " |"
        md_tables.append(md)

    return "\n\n".join(md_tables)


def smart_read_page(url: str, max_chars: int = 8000) -> str:
    """Fetch a page and return structured content with metadata.

    Returns early for non-English pages. Extracts metadata, clean
    paragraphs, and tables in a structured markdown format.
    """
    try:
        page = Fetcher.get(url, stealthy_headers=True, timeout=20)

        if page.status >= 400:
            return f"Failed to read: HTTP {page.status} for {url}"

        # Language detection — skip non-English pages
        lang = _detect_language(page)
        if lang and not lang.startswith("en"):
            return f"[SKIPPED] Non-English page (lang={lang}): {url}"

        # Extract metadata
        meta = _extract_metadata(page)

        # Extract paragraphs
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
