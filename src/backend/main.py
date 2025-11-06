import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from src.backend.database import init_db, add_task, get_tasks, get_messages, add_message, update_task_status

app = FastAPI()

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

class MemoryUpdateRequest(BaseModel):
    content: str

MEMORY_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "memory.md")

@app.on_event("startup")
def on_startup():
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

@app.get("/api/memory")
async def get_memory():
    if os.path.exists(MEMORY_PATH):
        with open(MEMORY_PATH, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": ""}

@app.post("/api/memory")
async def update_memory(req: MemoryUpdateRequest):
    with open(MEMORY_PATH, "w", encoding="utf-8") as f:
        f.write(req.content)
    return {"success": True}

def start_web_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)
