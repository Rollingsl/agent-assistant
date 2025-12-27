"""Find social profiles via targeted DuckDuckGo queries."""

from ddgs import DDGS
import time


SOCIAL_PLATFORMS = [
    ("LinkedIn", "site:linkedin.com/in OR site:linkedin.com/company"),
    ("Twitter/X", "site:twitter.com OR site:x.com"),
    ("GitHub", "site:github.com"),
    ("Crunchbase", "site:crunchbase.com"),
]


def find_social_profiles(name: str, max_platforms: int = 4) -> str:
    """Find social media profiles for a person or company.

    Runs site-specific DuckDuckGo searches for LinkedIn, Twitter, GitHub, Crunchbase.
    """
    name = name.strip()
    if not name:
        return "No name provided."

    lines = [f"## Social Profiles: {name}\n"]
    found_any = False

    for platform, site_query in SOCIAL_PLATFORMS[:max_platforms]:
        query = f"{name} {site_query}"
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=3))

            if results:
                found_any = True
                lines.append(f"### {platform}")
                for r in results:
                    title = r.get("title", "")
                    url = r.get("href", "")
                    snippet = r.get("body", "")[:100]
                    lines.append(f"- [{title}]({url})")
                    if snippet:
                        lines.append(f"  {snippet}")
                lines.append("")

            time.sleep(0.3)  # Rate limit between searches

        except Exception as e:
            lines.append(f"### {platform}")
            lines.append(f"- Search failed: {e}")
            lines.append("")

    if not found_any:
        return f"No social profiles found for '{name}'."

    return "\n".join(lines)
