import os
from litellm import completion
from src.backend.tools.registry import TOOL_SCHEMAS

# ─── Knowledge base path ───
KNOWLEDGE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data", "knowledge", "knowledge.md"
)

# ─── Domain system prompts ───
DOMAIN_PROMPTS = {
    "chief_of_staff": (
        "You are OPAS operating as a **Chief of Staff** agent. "
        "Your specialties: competitor analysis, market research briefs, meeting preparation, "
        "strategic memos, and executive summaries. Be analytical, concise, and data-driven. "
        "When researching, search the web for recent data and read relevant pages to extract facts. "
        "Always cite your sources."
    ),
    "creative_agency": (
        "You are OPAS operating as a **Creative Agency** agent. "
        "Your specialties: blog posts, social media campaigns, email newsletters, brand voice documents, "
        "and creative copywriting. Be creative, engaging, and on-brand. "
        "When writing, research trending topics and competitor content for inspiration. "
        "Generate polished output files when the task requires deliverables."
    ),
    "sales_intelligence": (
        "You are OPAS operating as a **Sales Intelligence** agent. "
        "Your specialties: lead research, cold outreach drafts, pitch deck outlines, "
        "competitive battlecards, and prospect profiling. Be sharp, persuasive, and thorough. "
        "Search for company information, funding rounds, tech stacks, and key decision makers."
    ),
    "custom": (
        "You are OPAS, a highly capable autonomous agent. "
        "You can search the web, read web pages, send emails, and generate files. "
        "Complete the user's task thoroughly and professionally."
    ),
}


def _read_knowledge() -> str:
    """Read the knowledge base file."""
    if os.path.exists(KNOWLEDGE_PATH):
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                return content
    return ""


def _build_system_prompt(category: str = "custom") -> str:
    """Build a domain-aware system prompt with knowledge base injection."""
    base = DOMAIN_PROMPTS.get(category, DOMAIN_PROMPTS["custom"])

    prompt = (
        f"{base}\n\n"
        "## Available Tools\n"
        "You have access to the following tools:\n"
        "- **web_search**: Search the web via DuckDuckGo\n"
        "- **read_webpage**: Fetch and read any public URL (bypasses anti-bot systems)\n"
        "- **scrape_page**: Scrape a URL with a CSS selector for targeted data extraction\n"
        "- **send_email**: Send emails via Gmail (requires approval)\n"
        "- **generate_file**: Create output files like .md, .txt, .csv, .json, .html (requires approval)\n\n"
        "Use tools proactively to gather information and produce deliverables. "
        "Don't just describe what you would do — actually do it using your tools. "
        "When your task is complete, provide a clear final summary of what was accomplished."
    )

    kb = _read_knowledge()
    if kb:
        prompt += f"\n\n## Knowledge Base Constraints\n{kb}"

    return prompt


def call_llm_with_tools(messages: list, category: str = "custom") -> dict:
    """
    Single LLM call with OpenAI function-calling tool definitions.
    Returns the raw LiteLLM response object.
    """
    llm_model = os.getenv("LLM_MODEL", "gpt-4o")
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or api_key == "your_openai_api_key_here":
        return None  # Caller should handle mock mode

    # Ensure system prompt is first message
    if not messages or messages[0].get("role") != "system":
        system_msg = {"role": "system", "content": _build_system_prompt(category)}
        messages = [system_msg] + messages

    try:
        response = completion(
            model=llm_model,
            messages=messages,
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
        )
        return response
    except Exception as e:
        print(f"[CORE] LLM call error: {e}")
        return None


def process_message(user_message: str) -> str:
    """Legacy: Takes a user message, processes it via the LLM, returns the response (no tools)."""
    llm_model = os.getenv("LLM_MODEL", "gpt-4o")
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or api_key == "your_openai_api_key_here":
        return f"[Mock Mode] Hi! I received: '{user_message}'. To make me smart, please add your OPENAI_API_KEY to the .env file!"

    system_context = _build_system_prompt("custom")

    try:
        response = completion(
            model=llm_model,
            messages=[
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_message}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error handling message: {e}")
        return f"I'm sorry, I hit a snag trying to think. Error details: {e}"
