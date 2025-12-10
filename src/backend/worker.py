import time
import json
from src.backend.database import (
    get_tasks, get_task, update_task_status, add_message,
    save_agent_state, get_agent_state, clear_agent_state, update_task_tokens
)
from src.backend.core import call_llm_with_tools, _build_system_prompt
from src.backend.tools.registry import DANGEROUS_TOOLS, execute_tool, parse_tool_args
from src.backend.pipelines import run_pipeline, resume_pipeline, get_pipeline

MAX_ITERATIONS = 15


def _run_agent_loop(task: dict):
    """
    Real agent loop: LLM decides which tools to call, we execute them,
    feed results back, and loop until the LLM finishes or budget is hit.
    """
    task_id = task["id"]
    category = task.get("category", "custom") or "custom"
    budget = task.get("budget", 50000) or 50000
    total_tokens = task.get("tokens_used", 0) or 0

    # Build initial conversation
    conversation = [
        {"role": "system", "content": _build_system_prompt(category)},
        {"role": "user", "content": (
            f"## Task: {task['title']}\n\n"
            f"{task['description']}\n\n"
            "Execute this task using your available tools. "
            "Search the web, read pages, and produce deliverables as needed. "
            "When finished, provide a final summary."
        )},
    ]

    add_message(task_id, "agent", f"Operation **{task['title']}** initialized. Executing with real tools...", msg_type="agent")

    for iteration in range(MAX_ITERATIONS):
        # Check token budget
        if total_tokens >= budget:
            add_message(task_id, "agent", f"Token budget exhausted ({total_tokens:,}/{budget:,}). Stopping.", msg_type="agent")
            break

        # Call LLM with tools
        response = call_llm_with_tools(conversation, category)

        if response is None:
            # No LLM available — try pipeline fallback if template matches
            pipeline = get_pipeline(task.get("title", ""))
            if pipeline:
                add_message(task_id, "agent",
                    "No API key configured. Switching to **Autopilot** (pipeline mode)...",
                    msg_type="agent")
                update_task_status(task_id, "running")
                run_pipeline(task)
                return
            else:
                add_message(
                    task_id, "agent",
                    "No API key configured and no pipeline available for this task. "
                    "Add your OPENAI_API_KEY in Integrations, or use a template with Autopilot mode.",
                    msg_type="agent"
                )
            break

        # Track token usage
        usage = getattr(response, "usage", None)
        if usage:
            total_tokens += getattr(usage, "total_tokens", 0)
            update_task_tokens(task_id, total_tokens)

        choice = response.choices[0]
        message = choice.message

        # Add assistant message to conversation
        assistant_msg = {"role": "assistant", "content": message.content or ""}
        if message.tool_calls:
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                }
                for tc in message.tool_calls
            ]
        conversation.append(assistant_msg)

        # If there's text content, log it
        if message.content:
            add_message(task_id, "agent", message.content, msg_type="agent")

        # If no tool calls, agent is done
        if not message.tool_calls:
            break

        # Process each tool call
        for tc in message.tool_calls:
            tool_name = tc.function.name
            tool_args = parse_tool_args(tc.function.arguments)

            # Log the tool call
            call_summary = f"`{tool_name}({json.dumps(tool_args, ensure_ascii=False)[:200]})`"
            add_message(task_id, "agent", call_summary, msg_type="tool_call")

            # Check if tool is dangerous → HITL
            if tool_name in DANGEROUS_TOOLS:
                # Serialize state for pause/resume
                state = {
                    "conversation": conversation,
                    "pending_tool_call": {
                        "id": tc.id,
                        "name": tool_name,
                        "arguments": tool_args,
                    },
                    "remaining_tool_calls": [
                        {
                            "id": rtc.id,
                            "name": rtc.function.name,
                            "arguments": parse_tool_args(rtc.function.arguments),
                        }
                        for rtc in message.tool_calls
                        if rtc.id != tc.id
                    ],
                    "total_tokens": total_tokens,
                    "iteration": iteration,
                }
                save_agent_state(task_id, json.dumps(state))

                # Request approval
                approval_msg = (
                    f"**Action requires approval:** `{tool_name}`\n\n"
                    f"**Arguments:**\n```json\n{json.dumps(tool_args, indent=2, ensure_ascii=False)}\n```\n\n"
                    "This is a high-impact action. Please review and authorize."
                )
                add_message(task_id, "agent", approval_msg, is_approval_request=True, msg_type="agent")
                update_task_status(task_id, "waiting_for_user")
                print(f"[WORKER] Task {task_id} paused for HITL approval on {tool_name}")
                return  # Exit — will resume when approved

            # Safe tool — execute immediately
            result = execute_tool(tool_name, tool_args)

            # Log result
            result_preview = result[:500] + ("..." if len(result) > 500 else "")
            add_message(task_id, "agent", result_preview, msg_type="tool_result")

            # Feed result back to conversation
            conversation.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    # Done
    update_task_status(task_id, "completed")
    print(f"[WORKER] Task {task_id} completed. Tokens used: {total_tokens:,}")


def _resume_agent_loop(task: dict):
    """
    Resume agent loop after HITL approval: execute the pending tool,
    then continue the agent loop.
    """
    task_id = task["id"]
    state_json = get_agent_state(task_id)

    if not state_json:
        add_message(task_id, "agent", "Error: No saved agent state found. Cannot resume.", msg_type="agent")
        update_task_status(task_id, "completed")
        return

    state = json.loads(state_json)
    conversation = state["conversation"]
    pending = state["pending_tool_call"]
    remaining = state.get("remaining_tool_calls", [])
    total_tokens = state.get("total_tokens", 0)
    iteration = state.get("iteration", 0)
    category = task.get("category", "custom") or "custom"
    budget = task.get("budget", 50000) or 50000

    clear_agent_state(task_id)

    add_message(task_id, "agent", "Approval verified. Executing authorized action...", msg_type="agent")

    # Execute the approved pending tool
    result = execute_tool(pending["name"], pending["arguments"])
    result_preview = result[:500] + ("..." if len(result) > 500 else "")
    add_message(task_id, "agent", result_preview, msg_type="tool_result")

    conversation.append({
        "role": "tool",
        "tool_call_id": pending["id"],
        "content": result,
    })

    # Execute remaining tool calls from the same batch (if any)
    for rtc in remaining:
        rtc_name = rtc["name"]
        rtc_args = rtc["arguments"]

        if rtc_name in DANGEROUS_TOOLS:
            # Another dangerous tool in the same batch — also execute after approval
            r = execute_tool(rtc_name, rtc_args)
            rp = r[:500] + ("..." if len(r) > 500 else "")
            add_message(task_id, "agent", f"`{rtc_name}` result: {rp}", msg_type="tool_result")
        else:
            r = execute_tool(rtc_name, rtc_args)
            rp = r[:500] + ("..." if len(r) > 500 else "")
            add_message(task_id, "agent", rp, msg_type="tool_result")

        conversation.append({
            "role": "tool",
            "tool_call_id": rtc["id"],
            "content": r,
        })

    # Continue the agent loop from where we left off
    for cont_iter in range(iteration + 1, MAX_ITERATIONS):
        if total_tokens >= budget:
            add_message(task_id, "agent", f"Token budget exhausted ({total_tokens:,}/{budget:,}). Stopping.", msg_type="agent")
            break

        response = call_llm_with_tools(conversation, category)

        if response is None:
            add_message(task_id, "agent", "[Mock Mode] No API key. Stopping.", msg_type="agent")
            break

        usage = getattr(response, "usage", None)
        if usage:
            total_tokens += getattr(usage, "total_tokens", 0)
            update_task_tokens(task_id, total_tokens)

        choice = response.choices[0]
        message = choice.message

        assistant_msg = {"role": "assistant", "content": message.content or ""}
        if message.tool_calls:
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                }
                for tc in message.tool_calls
            ]
        conversation.append(assistant_msg)

        if message.content:
            add_message(task_id, "agent", message.content, msg_type="agent")

        if not message.tool_calls:
            break

        for tc in message.tool_calls:
            tool_name = tc.function.name
            tool_args = parse_tool_args(tc.function.arguments)

            call_summary = f"`{tool_name}({json.dumps(tool_args, ensure_ascii=False)[:200]})`"
            add_message(task_id, "agent", call_summary, msg_type="tool_call")

            if tool_name in DANGEROUS_TOOLS:
                state = {
                    "conversation": conversation,
                    "pending_tool_call": {
                        "id": tc.id,
                        "name": tool_name,
                        "arguments": tool_args,
                    },
                    "remaining_tool_calls": [
                        {
                            "id": rtc.id,
                            "name": rtc.function.name,
                            "arguments": parse_tool_args(rtc.function.arguments),
                        }
                        for rtc in message.tool_calls
                        if rtc.id != tc.id
                    ],
                    "total_tokens": total_tokens,
                    "iteration": cont_iter,
                }
                save_agent_state(task_id, json.dumps(state))

                approval_msg = (
                    f"**Action requires approval:** `{tool_name}`\n\n"
                    f"**Arguments:**\n```json\n{json.dumps(tool_args, indent=2, ensure_ascii=False)}\n```\n\n"
                    "This is a high-impact action. Please review and authorize."
                )
                add_message(task_id, "agent", approval_msg, is_approval_request=True, msg_type="agent")
                update_task_status(task_id, "waiting_for_user")
                print(f"[WORKER] Task {task_id} paused again for HITL approval on {tool_name}")
                return

            result = execute_tool(tool_name, tool_args)
            result_preview = result[:500] + ("..." if len(result) > 500 else "")
            add_message(task_id, "agent", result_preview, msg_type="tool_result")

            conversation.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

    update_task_status(task_id, "completed")
    print(f"[WORKER] Task {task_id} completed after resume. Tokens: {total_tokens:,}")


def _is_pipeline_task(task: dict) -> bool:
    """Check if task should use pipeline mode (LLM-free execution)."""
    mode = task.get("execution_mode", "agent") or "agent"
    if mode == "pipeline":
        return True
    # Auto-detect: if mode is pipeline but title matches a known template
    return False


def _is_pipeline_resume(task: dict) -> bool:
    """Check if a resuming task was a pipeline (by checking saved state)."""
    state_json = get_agent_state(task["id"])
    if state_json:
        try:
            state = json.loads(state_json)
            return state.get("pipeline", False)
        except (json.JSONDecodeError, TypeError):
            pass
    return False


def process_background_tasks():
    """
    Continuous daemon thread that processes queued and approved tasks.
    Routes to either pipeline (LLM-free) or agent loop (LLM) based on execution_mode.
    """
    print("[WORKER] Background Task Engine Started.")

    while True:
        try:
            tasks = get_tasks()
            for t in tasks:
                task_id = t["id"]

                if t["status"] == "queued":
                    print(f"[WORKER] Starting task {task_id}: {t['title']}")
                    update_task_status(task_id, "running")

                    if _is_pipeline_task(t):
                        print(f"[WORKER] Using PIPELINE mode (zero tokens)")
                        run_pipeline(t)
                    else:
                        print(f"[WORKER] Using AGENT mode (LLM)")
                        _run_agent_loop(t)

                elif t["status"] == "approved":
                    print(f"[WORKER] Resuming task {task_id} after approval")
                    update_task_status(task_id, "running")

                    if _is_pipeline_resume(t):
                        print(f"[WORKER] Resuming PIPELINE after HITL")
                        resume_pipeline(t)
                    else:
                        _resume_agent_loop(t)

        except Exception as e:
            print(f"[WORKER ERROR] {e}")
            import traceback
            traceback.print_exc()
            time.sleep(5)

        time.sleep(3)
