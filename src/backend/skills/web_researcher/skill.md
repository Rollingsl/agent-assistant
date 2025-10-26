---
name: "Web Researcher"
description: "Equips the agent with the ability to autonomously browse the web, scrape content, and synthesize large amounts of data without hallucinating."
---

# Web Researcher Skill

You are equipped with the Web Researcher skill. This allows you to navigate external URLs and gather factual data.

## Procedures

1. Identify the exact URLs or search terms required to accomplish the objective.
2. Ensure your token budget can support the amount of text you plan to ingest. Do not scrape giant, irrelevant domains.
3. If hitting rate limits, implement exponential backoff.
4. Synthesize the findings into an actionable summary. If parsing applications (e.g. Universities), extract the Exact Deadlines, Requirements, and Application Portals.

## Tools

- `browser.py`: A python script that accepts `--url` and returns the sanitized Markdown content of the webpage.
