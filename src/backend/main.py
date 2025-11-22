import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from src.backend.database import init_db, add_task, get_tasks, get_messages, add_message, update_task_status

app = FastAPI()

# ---------------------------------------------------------------------------
# General Config Registry
# Each entry maps an env-var key to its display label, type, and group.
# ---------------------------------------------------------------------------
CONFIG_SCHEMA = [
    # key, label, group, is_secret, placeholder
    ("OPENAI_API_KEY",      "OpenAI API Key",         "LLM",      True,  "sk-..."),
    ("LLM_MODEL",           "LLM Model",              "LLM",      False, "gpt-4o"),
    ("EMAIL_ADDRESS",       "Gmail Address",          "Email",    False, "you@gmail.com"),
    ("EMAIL_PASS",          "Gmail App Password",     "Email",    True,  "xxxx xxxx xxxx xxxx"),
    ("TELEGRAM_TOKEN",      "Bot Token",              "Telegram", True,  "123456:ABC-DEF..."),
    ("TELEGRAM_CHAT_ID",    "Default Chat ID",        "Telegram", False, "-100123456789"),
    ("SLACK_TOKEN",         "Bot OAuth Token",        "Slack",    True,  "xoxb-..."),
    ("SLACK_CHANNEL",       "Default Channel",        "Slack",    False, "#general"),
    ("SLACK_WORKSPACE",     "Workspace Name",         "Slack",    False, "my-workspace"),
    ("DISCORD_TOKEN",       "Bot Token",              "Discord",  True,  "your-discord-bot-token"),
    ("DISCORD_GUILD_ID",    "Server (Guild) ID",      "Discord",  False, "123456789012345678"),
    ("DISCORD_CHANNEL_ID",  "Default Channel ID",     "Discord",  False, "123456789012345678"),
]

# In-memory overrides: {KEY: value}. Takes priority over .env at runtime.
_config_overrides: dict[str, str] = {}

# Enable CORS for the local developer dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class TaskRequest(BaseModel):
    title: str
    description: str
    deadline: str
    budget: int

class MessageRequest(BaseModel):
    content: str
    is_approval: bool = False

class KnowledgeUpdateRequest(BaseModel):
    content: str

class ConfigUpdateRequest(BaseModel):
    # Dict of { ENV_KEY: "value" }. Empty string means "clear override".
    values: dict[str, str]


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
KNOWLEDGE_DIR = os.path.join(DATA_DIR, "knowledge")
KNOWLEDGE_PATH = os.path.join(KNOWLEDGE_DIR, "knowledge.md")

DEFAULT_KNOWLEDGE = """# OPAS Neural Knowledge Base

This file acts as the persistent, long-term memory for OPAS.
The backend automatically injects these rules into the LLM context before every action.

## Core Directives:
1. Always strive for autonomous completion.
2. If an action is dangerous (e.g. spending tokens, sending emails), request HITL (Human-In-The-Loop) approval first.
3. Be concise and professional in all outputs.
"""


# ---------------------------------------------------------------------------
# Helper: mask a secret value for safe frontend display
# ---------------------------------------------------------------------------
def _mask(value: str) -> str:
    """Returns a masked version: first 4 chars + ****. Never exposes the real value."""
    if not value:
        return ""
    visible = value[:4] if len(value) >= 4 else value[:1]
    return visible + ("•" * min(12, len(value) - len(visible)))


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
    if not os.path.exists(KNOWLEDGE_PATH):
        with open(KNOWLEDGE_PATH, "w", encoding="utf-8") as f:
            f.write(DEFAULT_KNOWLEDGE)
    init_db()


# ---------------------------------------------------------------------------
# Task Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/tasks")
async def fetch_tasks():
    return {"tasks": get_tasks()}

@app.post("/api/tasks")
async def create_new_task(req: TaskRequest):
    task_id = add_task(req.title, req.description, req.deadline, req.budget)
    return {"message": "Success", "task_id": task_id}

@app.get("/api/tasks/{task_id}/messages")
async def fetch_task_messages(task_id: int):
    return {"messages": get_messages(task_id)}

@app.post("/api/tasks/{task_id}/messages")
async def post_task_message(task_id: int, req: MessageRequest):
    if req.is_approval:
        add_message(task_id, "user", "ACTION: APPROVED")
        add_message(task_id, "agent", "Receipt acknowledged. Resuming background operations.")
        update_task_status(task_id, "approved")
    else:
        add_message(task_id, "user", req.content)
    return {"success": True}

@app.post("/api/tasks/{task_id}/trigger")
async def trigger_task(task_id: int):
    """Immediately promotes a queued task to running so the worker picks it up."""
    tasks = get_tasks()
    task = next((t for t in tasks if t['id'] == task_id), None)
    if not task:
        return {"success": False, "message": "Task not found."}
    if task['status'] != 'queued':
        return {"success": False, "message": f"Task is already '{task['status']}', not queued."}
    update_task_status(task_id, 'queued')  # keep as queued — worker loop picks it up immediately
    add_message(task_id, "agent", "⚡ Manual trigger received. Elevating task priority — execution will begin on the next worker cycle.")
    return {"success": True, "message": "Task prioritised for immediate execution."}


# ---------------------------------------------------------------------------
# Knowledge Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/knowledge")
async def get_knowledge():
    if os.path.exists(KNOWLEDGE_PATH):
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": ""}

@app.post("/api/knowledge")
async def update_knowledge(req: KnowledgeUpdateRequest):
    with open(KNOWLEDGE_PATH, "w", encoding="utf-8") as f:
        f.write(req.content)
    return {"success": True}


# ---------------------------------------------------------------------------
# General Config Endpoints
# ---------------------------------------------------------------------------
PLACEHOLDER_SENTINELS = {"your_openai_api_key_here", "changeme", ""}

@app.get("/api/config")
async def get_config():
    """
    Returns the full config schema with masked values and source for each key.
    Source: 'override' (set via UI this session) | 'env' (in .env/environment) | 'unset'
    """
    result = []
    for key, label, group, is_secret, placeholder in CONFIG_SCHEMA:
        override_val = _config_overrides.get(key)
        env_val = os.getenv(key, "")
        env_set = bool(env_val and env_val not in PLACEHOLDER_SENTINELS)

        if override_val:
            source = "override"
            display = _mask(override_val) if is_secret else override_val
        elif env_set:
            source = "env"
            display = _mask(env_val) if is_secret else env_val
        else:
            source = "unset"
            display = ""

        result.append({
            "key": key,
            "label": label,
            "group": group,
            "is_secret": is_secret,
            "placeholder": placeholder,
            "source": source,        # 'override' | 'env' | 'unset'
            "display": display,      # Safe masked value or plain non-secret value
            "is_set": source != "unset",
        })
    return {"config": result}


@app.post("/api/config")
async def update_config(req: ConfigUpdateRequest):
    """
    Accepts a dict of {ENV_KEY: value}. Empty string clears the override
    so the backend falls back to .env. Non-empty values are applied immediately
    to os.environ so LLMs and other subsystems pick them up without restart.
    """
    updated = []
    for key, value in req.values.items():
        # Security check: only allow known keys
        known_keys = {entry[0] for entry in CONFIG_SCHEMA}
        if key not in known_keys:
            continue

        stripped = value.strip()
        if stripped:
            _config_overrides[key] = stripped
            os.environ[key] = stripped  # Immediate runtime effect
            updated.append(key)
        else:
            # Clear override; fall back to .env
            _config_overrides.pop(key, None)
            if key in os.environ and os.environ.get(key) == _config_overrides.get(key):
                pass  # Don't touch env if it came from .env
            updated.append(f"{key} (cleared)")

    return {"success": True, "updated": updated}


def start_web_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)
