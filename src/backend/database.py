import sqlite3
import os
from datetime import datetime

DB_PATH = "data/assistant.db"

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Tasks table
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT,
                  description TEXT,
                  status TEXT,
                  deadline TEXT,
                  budget INTEGER,
                  created_at TEXT)''')
    
    # Messages/Logs table for HITL (Human In The Loop)
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  task_id INTEGER,
                  sender TEXT,
                  content TEXT,
                  is_approval_request BOOLEAN,
                  created_at TEXT)''')
                  
    conn.commit()
    conn.close()

def add_task(title: str, description: str, deadline: str, budget: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO tasks (title, description, status, deadline, budget, created_at) VALUES (?, ?, 'queued', ?, ?, ?)",
              (title, description, deadline, budget, datetime.now().isoformat()))
    task_id = c.lastrowid
    conn.commit()
    conn.close()
    return task_id

def get_tasks():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    tasks = [dict(row) for row in c.fetchall()]
    conn.close()
    return tasks

def update_task_status(task_id: int, status: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE tasks SET status=? WHERE id=?", (status, task_id))
    conn.commit()
    conn.close()

def get_messages(task_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM messages WHERE task_id=? ORDER BY id ASC", (task_id,))
    messages = [dict(row) for row in c.fetchall()]
    conn.close()
    return messages

def add_message(task_id: int, sender: str, content: str, is_approval_request: bool = False):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO messages (task_id, sender, content, is_approval_request, created_at) VALUES (?, ?, ?, ?, ?)",
              (task_id, sender, content, is_approval_request, datetime.now().isoformat()))
    conn.commit()
    conn.close()
