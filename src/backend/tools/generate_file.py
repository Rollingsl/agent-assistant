"""Generate files in the data/outputs/ directory."""

import os

OUTPUTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "data", "outputs"
)

ALLOWED_EXTENSIONS = {".md", ".txt", ".csv", ".json", ".html"}


def generate_file(filename: str, content: str) -> str:
    """Write content to a file in data/outputs/. Only allows safe extensions."""
    _, ext = os.path.splitext(filename)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        return f"Error: Extension '{ext}' not allowed. Use one of: {', '.join(ALLOWED_EXTENSIONS)}"

    # Prevent path traversal
    safe_name = os.path.basename(filename)
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUTS_DIR, safe_name)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return f"File created: {safe_name} ({len(content)} chars)"
    except Exception as e:
        return f"Failed to write file: {e}"
