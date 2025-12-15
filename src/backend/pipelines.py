"""
Pipeline definitions for LLM-free execution.

Each pipeline is a sequence of tool steps that execute without any LLM calls,
using zero tokens. Steps can reference outputs from previous steps via {prev}
and task metadata via {title}, {description}.
"""

import json
import re
from src.backend.tools.registry import execute_tool, DANGEROUS_TOOLS
from src.backend.database import add_message, update_task_status, save_agent_state, get_user_preferences
from src.backend.memory import save_task_memories

# Language → DuckDuckGo region mapping
LANGUAGE_REGION_MAP = {
    "English": "us-en",
    "Spanish": "es-es",
    "French": "fr-fr",
    "German": "de-de",
    "Japanese": "jp-jp",
    "Chinese": "cn-zh",
    "Portuguese": "br-pt",
    "Arabic": "xa-ar",
    "Korean": "kr-kr",
}

# ─── Step Types ───
# Each step is a dict: { "tool": str, "args": dict, "label": str }
# Args can contain template variables:
#   {title}       → task title
#   {description} → task description
#   {prev}        → output of previous step (full text)
#   {prev_urls}   → URLs extracted from previous search results
#   {query}       → extracted search query from description

def _extract_query(task: dict) -> str:
    """Extract the core search subject from the task description.

    Examples:
    'Research Tesla Inc funding, tech stack...'       → 'Tesla Inc'
    'Research Stripe and draft 3 cold emails...'      → 'Stripe'
    'Create a market brief on electric vehicles...'   → 'electric vehicles'
    'Prepare briefing for meeting with Google team...'→ 'Google'
    """
    desc = task.get("description", "").strip()
    title = task.get("title", "").strip()

    if not desc:
        return title

    text = desc

    # Strip common instruction prefixes (longest first)
    prefixes = sorted([
        "research and write a blog post about ",
        "research and write about ", "research and draft ",
        "create a market brief on ", "create a brief on ",
        "prepare briefing materials for meeting with ",
        "prepare briefing for meeting with ",
        "research target company: ", "research prospect and ",
        "research top ", "research ", "analyze ", "investigate ",
        "find ", "look up ", "search for ", "compile a ",
        "compile ", "create a ", "create ", "write a ", "write ",
        "draft ", "build a ", "build ", "design a ", "design ",
        "prepare ", "generate ", "a market brief on ",
        "a brief on ", "briefing materials: ",
    ], key=len, reverse=True)

    for prefix in prefixes:
        if text.lower().startswith(prefix):
            text = text[len(prefix):]
            break

    # Stop at instruction boundaries — find the EARLIEST match
    stop_words = [
        " funding", " tech stack", " leadership", " product launches",
        " pricing", " market position", " pain points", " challenges",
        " with data", " with subject", " with citations",
        " draft ", " produce ", " output ", " compile ",
        ": ", ". ", "; ", " - ",
        ", and ", " and draft", " and write", " and recent", " and compile",
    ]
    earliest_idx = len(text)
    for stop in stop_words:
        idx = text.lower().find(stop)
        if idx > 2 and idx < earliest_idx:
            earliest_idx = idx
    if earliest_idx < len(text):
        text = text[:earliest_idx]

    # Clean up
    text = text.strip().rstrip(".,;:-")

    # If still too long, take just the first few words (the entity name)
    if len(text) > 40:
        words = text.split()
        text = " ".join(words[:5])

    return text.strip() if text.strip() else title


def _extract_urls_from_search(search_output: str, max_urls: int = 3) -> list[str]:
    """Extract URLs from web_search output text."""
    urls = re.findall(r'https?://[^\s\)\]"]+', search_output)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for u in urls:
        u = u.rstrip(".,;:")
        if u not in seen:
            seen.add(u)
            unique.append(u)
    return unique[:max_urls]


def _build_simple_report(title: str, sections: list[tuple[str, str]], prefs: dict | None = None) -> str:
    """Build a markdown report from labeled sections."""
    lines = [f"# {title}", ""]

    # Add author/company context from preferences
    if prefs:
        meta_parts = []
        if prefs.get("full_name"):
            meta_parts.append(f"**Prepared by** {prefs['full_name']}")
        if prefs.get("company_name"):
            meta_parts.append(f"**Prepared for** {prefs['company_name']}")
        if meta_parts:
            lines.append(" | ".join(meta_parts))
            lines.append("")

    for label, content in sections:
        if content and content.strip():
            lines.append(f"## {label}")
            lines.append("")
            # Clean up content
            cleaned = content.strip()
            if len(cleaned) > 3000:
                cleaned = cleaned[:3000] + "\n\n*[Content truncated]*"
            lines.append(cleaned)
            lines.append("")
    lines.append("---")
    lines.append("*Generated automatically by OPAS Autopilot (zero LLM tokens used)*")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════
# Pipeline Definitions
# ═══════════════════════════════════════════════════

PIPELINES: dict[str, dict] = {
    # ─── Chief of Staff ───
    "Competitor Analysis": {
        "category": "chief_of_staff",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} competitors"}, "label": "Searching for competitor data"},
            {"tool": "web_search", "args_template": {"query": "{query} market analysis pricing"}, "label": "Researching market positioning"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading top sources"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "competitor-analysis-{safe_title}.md", "label": "Compiling analysis report"},
        ],
    },
    "Market Brief": {
        "category": "chief_of_staff",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} market trends"}, "label": "Researching market trends"},
            {"tool": "web_search", "args_template": {"query": "{query} industry report growth"}, "label": "Searching industry reports"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading market reports"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "market-brief-{safe_title}.md", "label": "Generating market brief"},
        ],
    },
    "Meeting Prep": {
        "category": "chief_of_staff",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} recent news"}, "label": "Researching attendees & companies"},
            {"tool": "web_search", "args_template": {"query": "{query} company background"}, "label": "Finding background info"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading background info"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "meeting-prep-{safe_title}.md", "label": "Creating briefing document"},
        ],
    },
    "Strategic Memo": {
        "category": "chief_of_staff",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} strategic analysis"}, "label": "Researching strategic landscape"},
            {"tool": "web_search", "args_template": {"query": "{query} market size opportunity"}, "label": "Finding market data"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading strategic reports"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "strategic-memo-{safe_title}.md", "label": "Drafting strategic memo"},
        ],
    },

    # ─── Creative Agency ───
    "Blog Post": {
        "category": "creative_agency",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} insights data"}, "label": "Researching topic & trends"},
            {"tool": "web_search", "args_template": {"query": "{query} blog examples"}, "label": "Finding reference blogs"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading reference content"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "blog-draft-{safe_title}.md", "label": "Drafting blog post"},
        ],
    },
    "Social Campaign": {
        "category": "creative_agency",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} social media campaign examples"}, "label": "Researching social trends"},
            {"tool": "web_search", "args_template": {"query": "{query} trending hashtags"}, "label": "Finding trending hashtags"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Analyzing campaign examples"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "social-campaign-{safe_title}.md", "label": "Creating campaign plan"},
        ],
    },
    "Email Newsletter": {
        "category": "creative_agency",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} latest news"}, "label": "Gathering newsletter content"},
            {"tool": "web_search", "args_template": {"query": "{query} newsletter ideas"}, "label": "Finding content ideas"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading source material"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "newsletter-{safe_title}.md", "label": "Composing newsletter"},
        ],
    },
    "Brand Voice Doc": {
        "category": "creative_agency",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} brand voice guidelines"}, "label": "Researching brand voice examples"},
            {"tool": "web_search", "args_template": {"query": "{query} brand examples tone"}, "label": "Finding tone examples"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading brand guides"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "brand-voice-{safe_title}.md", "label": "Creating voice document"},
        ],
    },

    # ─── Sales Intelligence ───
    "Lead Research": {
        "category": "sales_intelligence",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} funding tech stack leadership"}, "label": "Searching company intel"},
            {"tool": "web_search", "args_template": {"query": "{query} news announcements"}, "label": "Finding recent news"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading company pages"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "lead-dossier-{safe_title}.md", "label": "Compiling lead dossier"},
        ],
    },
    "Cold Outreach": {
        "category": "sales_intelligence",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} company products services"}, "label": "Researching prospect"},
            {"tool": "web_search", "args_template": {"query": "{query} leadership team contact"}, "label": "Finding decision makers"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading prospect info"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "outreach-{safe_title}.md", "label": "Drafting outreach emails"},
        ],
    },
    "Pitch Deck Outline": {
        "category": "sales_intelligence",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} pain points challenges"}, "label": "Researching prospect needs"},
            {"tool": "web_search", "args_template": {"query": "{query} industry trends solutions"}, "label": "Finding industry solutions"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading industry insights"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "pitch-outline-{safe_title}.md", "label": "Building pitch outline"},
        ],
    },
    "Competitive Battlecard": {
        "category": "sales_intelligence",
        "steps": [
            {"tool": "web_search", "args_template": {"query": "{query} vs competitors comparison pricing"}, "label": "Searching competitive intel"},
            {"tool": "web_search", "args_template": {"query": "{query} reviews weaknesses"}, "label": "Finding competitor weaknesses"},
            {"tool": "read_webpage", "read_from_prev": True, "label": "Reading comparison data"},
            {"tool": "generate_file", "compile_report": True, "filename_template": "battlecard-{safe_title}.md", "label": "Creating battlecard"},
        ],
    },
}


def get_pipeline(template_title: str) -> dict | None:
    """Look up a pipeline by template title."""
    return PIPELINES.get(template_title)


def get_available_pipelines() -> list[dict]:
    """Return list of available pipeline names grouped by category."""
    result = []
    for name, pipeline in PIPELINES.items():
        result.append({
            "name": name,
            "category": pipeline["category"],
            "steps": len(pipeline["steps"]),
        })
    return result


def run_pipeline(task: dict) -> None:
    """
    Execute a predefined pipeline for a task. Zero LLM tokens used.
    Runs tool steps sequentially, collects outputs, and compiles a report.
    """
    task_id = task["id"]
    title = task.get("title", "Untitled")
    description = task.get("description", "")
    safe_title = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')[:40]

    # Load user preferences for personalization
    try:
        prefs = get_user_preferences()
    except Exception:
        prefs = {}

    region = LANGUAGE_REGION_MAP.get(prefs.get("language", ""), "us-en")

    pipeline = get_pipeline(title)
    if not pipeline:
        add_message(task_id, "agent",
                    f"No pipeline found for template '{title}'. Use Agent mode for custom tasks.",
                    msg_type="agent")
        update_task_status(task_id, "completed")
        return

    steps = pipeline["steps"]
    query = _extract_query(task)
    step_outputs: list[tuple[str, str]] = []  # (label, output)
    all_urls: list[str] = []
    prev_output = ""

    add_message(task_id, "agent",
                f"**Autopilot** executing **{title}** in {len(steps)} steps (zero LLM tokens).",
                msg_type="agent")

    for i, step in enumerate(steps):
        tool_name = step["tool"]
        step_label = step.get("label", f"Step {i+1}: {tool_name}")

        add_message(task_id, "agent", f"**Step {i+1}/{len(steps)}:** {step_label}",
                    msg_type="agent")

        try:
            # Build arguments
            if tool_name == "web_search":
                tpl = step.get("args_template", {})
                search_query = tpl.get("query", "{query}").format(
                    query=query, title=title, description=description[:200],
                    safe_title=safe_title, prev=prev_output[:500]
                )
                # Add company context to search when relevant
                company = prefs.get("company_name", "")
                if company and company.lower() not in search_query.lower():
                    industry = prefs.get("industry", "")
                    if industry:
                        search_query = f"{search_query} {industry}"
                args = {"query": search_query, "max_results": 8, "region": region}

            elif tool_name == "read_webpage" and step.get("read_from_prev"):
                # Read the top URLs found in previous search results
                urls = all_urls[:3] if all_urls else _extract_urls_from_search(prev_output, 3)
                if not urls:
                    add_message(task_id, "agent", "No URLs found to read. Skipping.", msg_type="tool_result")
                    continue

                # Read each URL and collect content
                combined_content = []
                for url in urls:
                    add_message(task_id, "agent", f"`read_webpage({url})`", msg_type="tool_call")
                    result = execute_tool("read_webpage", {"url": url, "max_chars": 6000})
                    preview = result[:300] + "..." if len(result) > 300 else result
                    add_message(task_id, "agent", preview, msg_type="tool_result")
                    combined_content.append((url, result))

                prev_output = "\n\n".join(f"### Source: {url}\n{content}" for url, content in combined_content)
                step_outputs.append((step_label, prev_output))
                continue

            elif tool_name == "generate_file" and step.get("compile_report"):
                # Compile all collected data into a report
                filename = step.get("filename_template", "report-{safe_title}.md").format(
                    safe_title=safe_title, title=title
                )
                report_content = _build_simple_report(title, step_outputs, prefs)

                # generate_file is a dangerous tool → needs HITL
                if tool_name in DANGEROUS_TOOLS:
                    state = {
                        "pipeline": True,
                        "pending_tool_call": {
                            "name": "generate_file",
                            "arguments": {"filename": filename, "content": report_content},
                        },
                    }
                    save_agent_state(task_id, json.dumps(state))

                    approval_msg = (
                        f"**Action requires approval:** `generate_file`\n\n"
                        f"**File:** `{filename}` ({len(report_content)} chars)\n\n"
                        "Review and authorize to save the generated report."
                    )
                    add_message(task_id, "agent", approval_msg, is_approval_request=True, msg_type="agent")
                    update_task_status(task_id, "waiting_for_user")
                    return
                else:
                    args = {"filename": filename, "content": report_content}

            elif tool_name == "generate_file":
                tpl = step.get("args_template", {})
                args = {
                    "filename": tpl.get("filename", "output.md").format(safe_title=safe_title),
                    "content": tpl.get("content", prev_output).format(
                        prev=prev_output, title=title, description=description
                    ),
                }
            else:
                # Generic tool call with template args
                tpl = step.get("args_template", {})
                args = {}
                for k, v in tpl.items():
                    if isinstance(v, str):
                        args[k] = v.format(
                            query=query, title=title, description=description[:200],
                            safe_title=safe_title, prev=prev_output[:500]
                        )
                    else:
                        args[k] = v

            # Check HITL for dangerous tools
            if tool_name in DANGEROUS_TOOLS:
                state = {
                    "pipeline": True,
                    "pending_tool_call": {
                        "name": tool_name,
                        "arguments": args,
                    },
                    "remaining_steps": [s for s in steps[i+1:]],
                    "step_outputs": [(l, o[:2000]) for l, o in step_outputs],
                    "all_urls": all_urls,
                    "step_index": i,
                }
                save_agent_state(task_id, json.dumps(state))

                approval_msg = (
                    f"**Action requires approval:** `{tool_name}`\n\n"
                    f"**Arguments:**\n```json\n{json.dumps(args, indent=2, ensure_ascii=False)[:500]}\n```\n\n"
                    "This is a high-impact action. Please review and authorize."
                )
                add_message(task_id, "agent", approval_msg, is_approval_request=True, msg_type="agent")
                update_task_status(task_id, "waiting_for_user")
                return

            # Execute safe tool
            call_summary = f"`{tool_name}({json.dumps(args, ensure_ascii=False)[:200]})`"
            add_message(task_id, "agent", call_summary, msg_type="tool_call")

            result = execute_tool(tool_name, args)
            prev_output = result

            # Collect URLs from search results
            if tool_name == "web_search":
                all_urls.extend(_extract_urls_from_search(result))

            # Log result preview
            result_preview = result[:500] + ("..." if len(result) > 500 else "")
            add_message(task_id, "agent", result_preview, msg_type="tool_result")
            step_outputs.append((step_label, result))

        except Exception as e:
            add_message(task_id, "agent", f"Step error: {e}", msg_type="tool_result")
            step_outputs.append((step_label, f"Error: {e}"))

    add_message(task_id, "agent",
                f"**Autopilot complete.** {len(steps)} steps executed. Zero LLM tokens used.",
                msg_type="agent")
    update_task_status(task_id, "completed")
    save_task_memories(task, source="pipeline")


def resume_pipeline(task: dict) -> None:
    """Resume a pipeline after HITL approval."""
    task_id = task["id"]

    from src.backend.database import get_agent_state, clear_agent_state

    state_json = get_agent_state(task_id)
    if not state_json:
        add_message(task_id, "agent", "Error: No saved state found.", msg_type="agent")
        update_task_status(task_id, "completed")
        return

    state = json.loads(state_json)
    clear_agent_state(task_id)

    pending = state["pending_tool_call"]
    add_message(task_id, "agent", "Approval verified. Executing authorized action...", msg_type="agent")

    result = execute_tool(pending["name"], pending["arguments"])
    result_preview = result[:500] + ("..." if len(result) > 500 else "")
    add_message(task_id, "agent", result_preview, msg_type="tool_result")

    # If there are remaining steps, continue them
    remaining = state.get("remaining_steps", [])
    if remaining:
        # For simplicity, the remaining steps after HITL are usually the final step
        # which was already the generate_file. Pipeline is done.
        pass

    add_message(task_id, "agent",
                "**Autopilot complete.** Pipeline finished after approval. Zero LLM tokens used.",
                msg_type="agent")
    update_task_status(task_id, "completed")
    save_task_memories(task, source="pipeline")
