import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import uvicorn
from pydantic import BaseModel
from src.database import init_db, add_task, get_tasks, get_messages, add_message, update_task_status

app = FastAPI()

class TaskRequest(BaseModel):
    title: str
    description: str
    deadline: str
    budget: int

class MessageRequest(BaseModel):
    content: str
    is_approval: bool = False

@app.on_event("startup")
def on_startup():
    """Initializes the background task persistent storage."""
    init_db()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    template_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    return html_content

@app.get("/api/tasks")
async def fetch_tasks():
    return {"tasks": get_tasks()}

@app.post("/api/tasks")
async def create_new_task(req: TaskRequest):
    # Enqueue a long-running background task
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

def start_web_server():
    """Start the standalone web interface."""
    uvicorn.run(app, host="0.0.0.0", port=3000)
