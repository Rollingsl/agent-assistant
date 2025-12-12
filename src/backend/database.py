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

    # ── Migrations: add new columns if they don't exist ──
    migrations = [
        "ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'custom'",
        "ALTER TABLE tasks ADD COLUMN agent_state TEXT",
        "ALTER TABLE tasks ADD COLUMN tokens_used INTEGER DEFAULT 0",
        "ALTER TABLE messages ADD COLUMN msg_type TEXT DEFAULT 'agent'",
        "ALTER TABLE tasks ADD COLUMN execution_mode TEXT DEFAULT 'agent'",
    ]
    for sql in migrations:
        try:
            c.execute(sql)
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists

    conn.close()

def add_task(title: str, description: str, deadline: str, budget: int, category: str = "custom", execution_mode: str = "agent"):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO tasks (title, description, status, deadline, budget, category, execution_mode, created_at) VALUES (?, ?, 'queued', ?, ?, ?, ?, ?)",
        (title, description, deadline, budget, category, execution_mode, datetime.now().isoformat())
    )
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

def get_task(task_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM tasks WHERE id=?", (task_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

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

def add_message(task_id: int, sender: str, content: str, is_approval_request: bool = False, msg_type: str = "agent"):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO messages (task_id, sender, content, is_approval_request, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (task_id, sender, content, is_approval_request, msg_type, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

# ── Agent state persistence for HITL pause/resume ──

def save_agent_state(task_id: int, state_json: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE tasks SET agent_state=? WHERE id=?", (state_json, task_id))
    conn.commit()
    conn.close()

def get_agent_state(task_id: int) -> str | None:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT agent_state FROM tasks WHERE id=?", (task_id,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def clear_agent_state(task_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE tasks SET agent_state=NULL WHERE id=?", (task_id,))
    conn.commit()
    conn.close()

def update_task_tokens(task_id: int, tokens_used: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE tasks SET tokens_used=? WHERE id=?", (tokens_used, task_id))
    conn.commit()
    conn.close()


# ── User Preferences ──

def _init_preferences_table():
    """Create the user_preferences table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        full_name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        language TEXT DEFAULT 'English',
        company_name TEXT DEFAULT '',
        industry TEXT DEFAULT '',
        tone TEXT DEFAULT 'professional',
        target_audience TEXT DEFAULT '',
        custom_instructions TEXT DEFAULT '',
        updated_at TEXT
    )''')
    conn.commit()
    conn.close()


def get_user_preferences() -> dict:
    """Get user preferences, auto-creating defaults if table/row is empty."""
    _init_preferences_table()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM user_preferences WHERE id = 1")
    row = c.fetchone()
    if not row:
        c.execute(
            "INSERT INTO user_preferences (id, updated_at) VALUES (1, ?)",
            (datetime.now().isoformat(),)
        )
        conn.commit()
        c.execute("SELECT * FROM user_preferences WHERE id = 1")
        row = c.fetchone()
    conn.close()
    d = dict(row)
    d.pop("id", None)
    return d


def save_user_preferences(prefs: dict):
    """Upsert user preferences (single row, id=1)."""
    _init_preferences_table()
    allowed = {
        "full_name", "email", "language", "company_name",
        "industry", "tone", "target_audience", "custom_instructions",
    }
    filtered = {k: v for k, v in prefs.items() if k in allowed}
    filtered["updated_at"] = datetime.now().isoformat()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Ensure row exists
    c.execute("SELECT id FROM user_preferences WHERE id = 1")
    if not c.fetchone():
        c.execute("INSERT INTO user_preferences (id) VALUES (1)")

    sets = ", ".join(f"{k}=?" for k in filtered)
    vals = list(filtered.values())
    c.execute(f"UPDATE user_preferences SET {sets} WHERE id = 1", vals)
    conn.commit()
    conn.close()
