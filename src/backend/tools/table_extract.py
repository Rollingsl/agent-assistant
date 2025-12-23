"""Extract HTML tables from web pages and convert to markdown format."""

import logging

logging.getLogger("scrapling").setLevel(logging.WARNING)


def extract_tables(url: str, max_tables: int = 5) -> str:
    """Fetch a webpage and extract HTML tables as markdown.

    Uses Scrapling to fetch and parse the page.
    Returns tables formatted as markdown with headers.
    """
    url = url.strip()
    if not url:
        return "No URL provided."
    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        from scrapling.fetchers import Fetcher
        page = Fetcher.get(url, stealthy_headers=True, timeout=15)

        if page.status >= 400:
            return f"Failed to fetch {url}: HTTP {page.status}"

        tables = page.css("table")
        if not tables:
            return f"No tables found on {url}."

        lines = [f"## Tables from {url}\n"]
        table_count = 0

        for table in tables:
            if table_count >= max_tables:
                break

            rows = table.css("tr")
            if not rows or len(rows) < 2:
                continue

            table_data: list[list[str]] = []
            for row in rows:
                cells = row.css("th, td")
                row_data = []
                for cell in cells:
                    text = " ".join(cell.css("::text").getall()).strip()
                    text = text.replace("|", "\\|")  # Escape pipes
                    row_data.append(text)
                if row_data:
                    table_data.append(row_data)

            if len(table_data) < 2:
                continue

            # Normalize column count
            max_cols = max(len(r) for r in table_data)
            for r in table_data:
                while len(r) < max_cols:
                    r.append("")

            table_count += 1
            lines.append(f"### Table {table_count}\n")

            # Header row
            header = table_data[0]
            lines.append("| " + " | ".join(header) + " |")
            lines.append("| " + " | ".join("---" for _ in header) + " |")

            # Data rows
            for row in table_data[1:]:
                lines.append("| " + " | ".join(row) + " |")

            lines.append("")

        if table_count == 0:
            return f"Tables found on {url} but none had usable content."

        return "\n".join(lines)

    except Exception as e:
        return f"Table extraction failed for {url}: {e}"
