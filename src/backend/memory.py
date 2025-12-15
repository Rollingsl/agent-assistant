"""
Automatic memory extraction after task completion.

Two paths:
- Agent mode (LLM available): Small extraction prompt over conversation → 2-5 bullet facts
- Pipeline mode (no LLM): Deterministic metadata extraction from task title/description/category
"""

import os
from src.backend.database import add_memory, get_messages


def save_task_memories(task: dict, source: str = "agent"):
    """Entry point: extract and store memories from a completed task."""
    try:
        if source == "agent":
            _extract_memories_agent(task)
        else:
            _extract_memories_pipeline(task)
    except Exception as e:
        print(f"[MEMORY] Error extracting memories for task {task.get('id')}: {e}")


def _extract_memories_agent(task: dict):
    """Use LLM to extract key facts from conversation history."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        # No LLM available — fall back to pipeline extraction
        _extract_memories_pipeline(task)
        return

    task_id = task["id"]
    messages = get_messages(task_id)

    # Build conversation excerpt: only agent + tool_result messages, last 6000 chars
    excerpt_parts = []
    for msg in messages:
        if msg.get("msg_type") in ("agent", "tool_result"):
            excerpt_parts.append(msg.get("content", ""))

    excerpt = "\n".join(excerpt_parts)
    if len(excerpt) > 6000:
        excerpt = excerpt[-6000:]

    if not excerpt.strip():
        _extract_memories_pipeline(task)
        return

    extraction_prompt = (
        "You are a memory extraction system. Given the following task conversation, "
        "extract 2-5 key facts or learnings that would be useful to remember for future tasks. "
        "Each fact should be a single concise bullet point. Focus on:\n"
        "- What the task was about and the domain/topic\n"
        "- Key findings or data points discovered\n"
        "- Tools or approaches that worked well\n"
        "- User preferences or patterns observed\n\n"
        "Output ONLY the bullet points, one per line, starting with '- '. No other text."
    )

    try:
        from litellm import completion
        llm_model = os.getenv("LLM_MODEL", "gpt-4o")
        response = completion(
            model=llm_model,
            messages=[
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": (
                    f"Task: {task.get('title', 'Untitled')}\n"
                    f"Category: {task.get('category', 'custom')}\n\n"
                    f"Conversation:\n{excerpt}"
                )},
            ],
            max_tokens=300,
            temperature=0.2,
        )

        text = response.choices[0].message.content or ""
        bullets = [
            line.lstrip("- ").strip()
            for line in text.strip().split("\n")
            if line.strip().startswith("- ") or line.strip().startswith("* ")
        ]

        for bullet in bullets[:5]:
            if bullet:
                add_memory(task_id, bullet, source="agent")

        if bullets:
            print(f"[MEMORY] Extracted {len(bullets)} memories from task {task_id} (agent)")

    except Exception as e:
        print(f"[MEMORY] LLM extraction failed for task {task_id}: {e}")
        _extract_memories_pipeline(task)


def _extract_memories_pipeline(task: dict):
    """Deterministic metadata extraction — no LLM needed."""
    task_id = task["id"]
    title = task.get("title", "").strip()
    description = task.get("description", "").strip()
    category = task.get("category", "custom") or "custom"

    bullets = []

    # Fact 1: Task title + category
    category_label = category.replace("_", " ").title()
    if title:
        bullets.append(f"Completed {category_label} task: {title}")

    # Fact 2: First sentence of description
    if description:
        first_sentence = description.split(".")[0].strip()
        if first_sentence and len(first_sentence) > 10:
            bullets.append(f"Task scope: {first_sentence}")

    # Fact 3: Execution mode
    mode = task.get("execution_mode", "agent")
    if mode == "pipeline":
        bullets.append(f"Executed via Autopilot pipeline (zero LLM tokens)")

    for bullet in bullets[:4]:
        if bullet:
            add_memory(task_id, bullet, source="pipeline")

    if bullets:
        print(f"[MEMORY] Extracted {len(bullets)} memories from task {task_id} (pipeline)")
