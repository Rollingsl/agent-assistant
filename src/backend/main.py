import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from src.backend.database import init_db, add_task, get_tasks, get_messages, add_message, update_task_status

app = FastAPI()

# In-memory key override (set via /api/config/openai, takes priority over .env)
_openai_key_override: str | None = None

# Enable CORS for the local developer dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class ApiKeyRequest(BaseModel):
    api_key: str

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

@app.on_event("startup")
def on_startup():
    # 1. Ensure Data Directory Exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 2. Ensure Knowledge Directory Exists
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
    
    # 3. Seed Knowledge Base if empty
    if not os.path.exists(KNOWLEDGE_PATH):
        with open(KNOWLEDGE_PATH, "w", encoding="utf-8") as f:
            f.write(DEFAULT_KNOWLEDGE)
            
    # 4. Initialize SQLite Database
    init_db()

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

@app.get("/api/config/openai")
async def get_openai_config():
    """Returns whether an OpenAI key is configured (from .env or UI override)."""
    global _openai_key_override
    env_key = os.getenv("OPENAI_API_KEY", "")
    has_env_key = bool(env_key and env_key != "your_openai_api_key_here")
    has_override = bool(_openai_key_override)
    return {"has_key": has_env_key or has_override, "source": "override" if has_override else ("env" if has_env_key else "none")}

@app.post("/api/config/openai")
async def set_openai_key(req: ApiKeyRequest):
    """Accepts an API key from the UI to override what's in .env at runtime."""
    global _openai_key_override
    _openai_key_override = req.api_key.strip() if req.api_key.strip() else None
    # Also push it into the environment so litellm/openai SDK picks it up
    if _openai_key_override:
        os.environ["OPENAI_API_KEY"] = _openai_key_override
    return {"success": True, "message": "API key updated for this session."}

def start_web_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)
