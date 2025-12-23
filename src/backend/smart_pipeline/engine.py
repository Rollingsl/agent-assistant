"""Smart pipeline engine — orchestrates the full zero-token pipeline.

Flow: Analyze → Build queries → Execute searches → Select top URLs →
      Run supplementary tools → Read pages → Synthesize → Build report →
      Generate file (HITL)
"""

import json
import re

from src.backend.smart_pipeline.analyzer import analyze_task, TaskAnalysis
from src.backend.smart_pipeline.query_builder import build_search_strategy, SearchStrategy
from src.backend.smart_pipeline.synthesizer import synthesize, SynthesisResult
from src.backend.smart_pipeline.report_builder import build_report
from src.backend.tools.registry import execute_tool, DANGEROUS_TOOLS
from src.backend.database import add_message, update_task_status, save_agent_state, get_user_preferences
from src.backend.memory import save_task_memories


# Domain quality scores for URL ranking
DOMAIN_QUALITY = {
    "wikipedia.org": 3,
    "reuters.com": 3, "bloomberg.com": 3, "wsj.com": 3,
    "nytimes.com": 3, "bbc.com": 3, "bbc.co.uk": 3,
    "techcrunch.com": 2, "theverge.com": 2, "arstechnica.com": 2,
    "wired.com": 2, "forbes.com": 2, "businessinsider.com": 2,
    "github.com": 2, "stackoverflow.com": 2,
    "crunchbase.com": 2, "linkedin.com": 2,
    "medium.com": 1, "dev.to": 1, "hackernews.com": 1,
}

# Language → DuckDuckGo region mapping (imported from pipelines)
LANGUAGE_REGION_MAP = {
    "English": "us-en", "Spanish": "es-es", "French": "fr-fr",
    "German": "de-de", "Japanese": "jp-jp", "Chinese": "cn-zh",
    "Portuguese": "br-pt", "Arabic": "xa-ar", "Korean": "kr-kr",
}


def _extract_urls_from_search(search_output: str, max_urls: int = 5) -> list[str]:
    """Extract URLs from web_search output text."""
    urls = re.findall(r'https?://[^\s\)\]"]+', search_output)
    seen = set()
    unique = []
    for u in urls:
        u = u.rstrip(".,;:")
        if u not in seen:
            seen.add(u)
            unique.append(u)
    return unique[:max_urls]


def _score_url(url: str, analysis: TaskAnalysis) -> float:
    """Score a URL by domain quality + entity relevance."""
    score = 0.0

    # Domain quality
    for domain, quality in DOMAIN_QUALITY.items():
        if domain in url:
            score += quality
            break

    # Entity match in URL
    for entity in analysis.entities:
        if entity.lower().replace(" ", "") in url.lower().replace("-", "").replace("_", ""):
            score += 2.0

    # Domain match
    for domain in analysis.domains:
        if domain in url:
            score += 3.0

    return score


def _rank_urls(urls: list[str], analysis: TaskAnalysis, max_urls: int = 4) -> list[str]:
    """Rank and select the best URLs to read."""
    scored = [(url, _score_url(url, analysis)) for url in urls]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [url for url, _ in scored[:max_urls]]


def run_smart_pipeline(task: dict) -> None:
    """Execute the smart pipeline for an arbitrary task.

    This is the main entry point called when no hardcoded template matches.
    Runs entirely without LLM tokens.
    """
    task_id = task["id"]
    title = task.get("title", "Untitled")
    description = task.get("description", "")
    safe_title = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')[:40]

    # Load user preferences
    try:
        prefs = get_user_preferences()
    except Exception:
        prefs = {}

    region = LANGUAGE_REGION_MAP.get(prefs.get("language", ""), "us-en")

    # ─── Step 1: Analyze Task ───
    add_message(task_id, "agent",
                "**Smart Pipeline** analyzing task (zero LLM tokens)...",
                msg_type="agent")

    analysis = analyze_task(title, description)

    add_message(task_id, "agent",
                f"**Analysis:** Intent=`{analysis.intent}` (confidence: {analysis.confidence:.0%})"
                + (f" | Entities: {', '.join(analysis.entities[:3])}" if analysis.entities else "")
                + (f" | Domains: {', '.join(analysis.domains[:2])}" if analysis.domains else "")
                + (f" | Tech: {', '.join(analysis.technologies[:3])}" if analysis.technologies else ""),
                msg_type="tool_result")

    # ─── Step 2: Build Search Strategy ───
    strategy = build_search_strategy(analysis)
    total_steps = len(strategy.queries) + len(strategy.tool_lookups) + 2  # +read pages +generate file

    add_message(task_id, "agent",
                f"**Strategy:** {len(strategy.queries)} searches + {len(strategy.tool_lookups)} tool lookups planned.",
                msg_type="agent")

    # ─── Step 3: Execute Searches ───
    all_urls: list[str] = []
    search_outputs: list[str] = []
    step_num = 0

    for query in strategy.queries:
        step_num += 1
        add_message(task_id, "agent",
                    f"**Step {step_num}/{total_steps}:** Searching: *{query}*",
                    msg_type="agent")

        call_summary = f'`web_search({{"query": "{query[:80]}"}})`'
        add_message(task_id, "agent", call_summary, msg_type="tool_call")

        try:
            result = execute_tool("web_search", {"query": query, "max_results": 8, "region": region})
            urls = _extract_urls_from_search(result)
            all_urls.extend(urls)
            search_outputs.append(result)

            preview = result[:400] + "..." if len(result) > 400 else result
            add_message(task_id, "agent", preview, msg_type="tool_result")
        except Exception as e:
            add_message(task_id, "agent", f"Search error: {e}", msg_type="tool_result")

    # ─── Step 4: Run Supplementary Tools ───
    supplementary_data: list[tuple[str, str]] = []

    for lookup in strategy.tool_lookups:
        step_num += 1
        add_message(task_id, "agent",
                    f"**Step {step_num}/{total_steps}:** {lookup.label}",
                    msg_type="agent")

        call_summary = f'`{lookup.tool}({json.dumps(lookup.args, ensure_ascii=False)[:150]})`'
        add_message(task_id, "agent", call_summary, msg_type="tool_call")

        try:
            result = execute_tool(lookup.tool, lookup.args)
            supplementary_data.append((lookup.label, result))

            preview = result[:300] + "..." if len(result) > 300 else result
            add_message(task_id, "agent", preview, msg_type="tool_result")
        except Exception as e:
            add_message(task_id, "agent", f"Tool error: {e}", msg_type="tool_result")

    # ─── Step 5: Select & Read Top URLs ───
    step_num += 1
    # Deduplicate URLs
    seen_urls = set()
    unique_urls = []
    for u in all_urls:
        if u not in seen_urls:
            seen_urls.add(u)
            unique_urls.append(u)

    ranked_urls = _rank_urls(unique_urls, analysis, max_urls=4)

    add_message(task_id, "agent",
                f"**Step {step_num}/{total_steps}:** Reading {len(ranked_urls)} top sources...",
                msg_type="agent")

    content_items: list[tuple[str, str]] = []

    for url in ranked_urls:
        add_message(task_id, "agent", f"`read_webpage({url})`", msg_type="tool_call")
        try:
            result = execute_tool("read_webpage", {"url": url, "max_chars": 6000})
            content_items.append((url, result))

            preview = result[:250] + "..." if len(result) > 250 else result
            add_message(task_id, "agent", preview, msg_type="tool_result")
        except Exception as e:
            add_message(task_id, "agent", f"Read error for {url}: {e}", msg_type="tool_result")

    # Also include search result snippets as content
    for i, output in enumerate(search_outputs):
        content_items.append((f"search-{i+1}", output))

    # ─── Step 6: Synthesize ───
    add_message(task_id, "agent",
                "**Synthesizing** extracted content...",
                msg_type="agent")

    synthesis = synthesize(content_items, analysis)

    section_summary = ", ".join(f"{k}: {len(v)}" for k, v in synthesis.sections.items())
    add_message(task_id, "agent",
                f"Extracted **{synthesis.total_facts}** relevant facts across sections: {section_summary}",
                msg_type="tool_result")

    # ─── Step 7: Build Report ───
    report_title = strategy.report_title
    report_content = build_report(
        title=report_title,
        analysis=analysis,
        synthesis=synthesis,
        supplementary_data=supplementary_data,
        prefs=prefs,
    )

    # ─── Step 8: Generate File (HITL) ───
    step_num += 1
    filename = f"smart-report-{safe_title}.md"

    add_message(task_id, "agent",
                f"**Step {step_num}/{total_steps}:** Generating report file...",
                msg_type="agent")

    # generate_file is dangerous → HITL
    state = {
        "pipeline": True,
        "smart_pipeline": True,
        "pending_tool_call": {
            "name": "generate_file",
            "arguments": {"filename": filename, "content": report_content},
        },
    }
    save_agent_state(task_id, json.dumps(state))

    approval_msg = (
        f"**Action requires approval:** `generate_file`\n\n"
        f"**File:** `{filename}` ({len(report_content)} chars, {synthesis.total_facts} facts)\n\n"
        f"**Report:** {report_title}\n\n"
        "Review and authorize to save the generated report."
    )
    add_message(task_id, "agent", approval_msg, is_approval_request=True, msg_type="agent")
    update_task_status(task_id, "waiting_for_user")
