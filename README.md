# OPAS — Autonomous Personal Agent System

> A locally-hosted, privacy-first autonomous agent with a modern Next.js dashboard and FastAPI backend. Delegate tasks with a deadline and token budget — OPAS executes them in the background using a tool-calling architecture, requesting your approval before any irreversible action.

---

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Execution Modes](#-execution-modes)
- [Tools](#-tools)
- [Autopilot Pipelines](#-autopilot-pipelines)
- [Memory System](#-memory-system)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)

---

## Features

| Feature              | Description                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Dual Exec Modes**  | Agent mode (full LLM reasoning) or Autopilot pipelines (zero tokens, deterministic)       |
| **Tool System**      | Web search, page reading, CSS scraping, email dispatch, file generation                   |
| **HITL Safety**      | Human-in-the-Loop intercepts for high-risk actions (email sends, file generation)         |
| **Knowledge Base**   | Persistent markdown file injected into every agent context — editable from the UI         |
| **Agent Memory**     | Auto-extracted learnings from completed tasks, injected into future prompts                |
| **User Preferences** | Name, company, industry, tone, language, custom instructions — all influence agent output  |
| **Model Agnostic**   | Works with OpenAI, Anthropic, or local Ollama models via LiteLLM                          |
| **Autopilot**        | 12 pre-built pipelines across 3 domains that execute tasks with zero LLM tokens           |
| **Theme System**     | Dark / Light / Aurora themes with full CSS variable theming                                |
| **Live Config**      | All credentials configurable via `.env` file or live UI override — no restart needed       |
| **Token Budgets**    | Per-task token budget tracking with automatic cutoff when exhausted                        |

---

## Quick Start

### Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js v20+](https://nodejs.org/en)

### 1 — Clone & Configure

```bash
git clone <your-repo-url>
cd assistant
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY at minimum
```

### 2 — Install (One-Click)

| OS                | Command                               |
| ----------------- | ------------------------------------- |
| **Windows**       | Double-click `install.bat`            |
| **macOS / Linux** | `chmod +x install.sh && ./install.sh` |

The installer creates a Python virtual environment, installs all `pip` dependencies, and runs `npm install` for the frontend.

### 3 — Run

```bash
# Activate virtual environment first
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows

# Launch both services
python3 dev.py
```

`dev.py` starts both the FastAPI backend (port 8009) and the Next.js frontend (port 8008) in parallel. Open **http://localhost:8008** to access the OPAS Operations Dashboard.

### Docker (Alternative)

```bash
docker-compose up --build
```

Runs the backend on port 8000 and the frontend on port 80. Task data persists in the `./data` volume.

---

## Configuration

All credentials are read from `.env` at startup. You can also override any value **live** via the **Integrations** panel in the UI — no restart needed. Overrides apply to the current session only and take immediate effect on `os.environ`.

See [`.env.example`](.env.example) for all available variables with inline documentation.

### Minimum Required

```env
OPENAI_API_KEY=sk-...      # Or any LiteLLM-compatible key
LLM_MODEL=gpt-4o-mini
```

Without an API key, OPAS still works in **Autopilot mode** — the 12 pre-built pipelines execute using only tool calls and zero LLM tokens.

### All Supported Integrations

| Service                | Env Variables                                     | Purpose                         |
| ---------------------- | ------------------------------------------------- | ------------------------------- |
| **OpenAI / LiteLLM**   | `OPENAI_API_KEY`, `LLM_MODEL`                    | Core agent reasoning            |
| **Gmail**              | `EMAIL_ADDRESS`, `EMAIL_PASS`                     | Email dispatch tool             |
| **Telegram**           | `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`              | Notification bot (planned)      |
| **Slack**              | `SLACK_TOKEN`, `SLACK_CHANNEL`, `SLACK_WORKSPACE` | Workspace messaging (planned)   |
| **Discord**            | `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID` | Server messaging (planned) |

### Getting Your API Keys

| Service                | Where to get it                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**             | [platform.openai.com/api-keys](https://platform.openai.com/api-keys)               |
| **Anthropic**          | [console.anthropic.com](https://console.anthropic.com/)                            |
| **Gmail App Password** | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)     |
| **Telegram Bot Token** | Message [@BotFather](https://t.me/botfather) on Telegram                            |
| **Slack Bot Token**    | [api.slack.com/apps](https://api.slack.com/apps) — create app, add scopes, install |
| **Discord Bot Token**  | [discord.com/developers/applications](https://discord.com/developers/applications) |

---

## Architecture

```
Browser (Next.js)          FastAPI Backend              Background Worker
┌──────────────┐          ┌──────────────┐          ┌──────────────────┐
│  Dashboard   │──HTTP──>│  main.py     │          │  worker.py       │
│  Sidebar     │         │  (REST API)  │          │  (daemon thread) │
│  Knowledge   │         │              │          │                  │
│  Integrations│         │  Endpoints:  │          │  Polls tasks DB  │
│  Preferences │         │  /api/tasks  │          │  every 3 seconds │
│              │         │  /api/memories│         │                  │
│              │         │  /api/config │          │  Routes to:      │
└──────────────┘         └──────┬───────┘          │  - Agent loop    │
                                │                   │  - Pipeline exec │
                         ┌──────▼───────┐          │                  │
                         │  SQLite DB   │<─────────│  On completion:  │
                         │ assistant.db │          │  - memory.py     │
                         │              │          │    extracts facts │
                         │ Tables:      │          └──────────────────┘
                         │ - tasks      │
                         │ - messages   │          ┌──────────────────┐
                         │ - memories   │          │  core.py         │
                         │ - user_prefs │          │  (LLM engine)    │
                         └──────────────┘          │                  │
                                                    │  System prompt:  │
                         ┌──────────────┐          │  Domain context  │
                         │ knowledge.md │──inject──>│  + Tools list    │
                         │ (file on     │          │  + User prefs    │
                         │  disk)       │          │  + Knowledge     │
                         └──────────────┘          │  + Agent Memory  │
                                                    └──────────────────┘
```

### Request Flow

1. User creates a task via the Dashboard (title, description, deadline, token budget, category, execution mode)
2. Task is inserted into SQLite with status `queued`
3. The background worker thread picks it up within 3 seconds
4. Based on `execution_mode`, it routes to either the **Agent loop** or a **Pipeline**
5. During execution, messages are logged to the `messages` table and visible in real-time on the Dashboard
6. If a dangerous tool is invoked (email, file generation), the task pauses with status `waiting_for_user`
7. The user reviews and approves; the worker resumes from the saved state
8. On completion, the **memory system** extracts key facts and stores them for future tasks

---

## Execution Modes

### Agent Mode (LLM)

The agent loop (`worker.py` > `_run_agent_loop`) sends the task to the LLM with tool definitions. The LLM decides which tools to call, OPAS executes them, feeds results back, and loops — up to 15 iterations or until the token budget is exhausted.

The system prompt (`core.py` > `_build_system_prompt`) is composed of:

1. **Domain prompt** — category-specific persona (Chief of Staff, Creative Agency, Sales Intelligence, or Custom)
2. **Available Tools** — descriptions of all 5 tools
3. **User Context** — preferences (name, company, tone, language, etc.)
4. **Knowledge Base** — contents of `data/knowledge/knowledge.md`
5. **Agent Memory** — auto-extracted learnings from prior completed tasks

### Autopilot Mode (Pipeline)

Pipelines (`pipelines.py`) execute a fixed sequence of tool calls with zero LLM tokens. Each pipeline has 4 steps: two web searches, a page read pass, and a report compilation. The output file triggers HITL approval before being written to disk.

Task categories determine which pipelines are available:

| Category             | Available Pipelines                                              |
| -------------------- | ---------------------------------------------------------------- |
| **Chief of Staff**   | Competitor Analysis, Market Brief, Meeting Prep, Strategic Memo  |
| **Creative Agency**  | Blog Post, Social Campaign, Email Newsletter, Brand Voice Doc    |
| **Sales Intelligence**| Lead Research, Cold Outreach, Pitch Deck Outline, Competitive Battlecard |

---

## Tools

All tools are registered in `src/backend/tools/registry.py` with OpenAI function-calling schemas.

| Tool              | Module              | HITL Required | Description                                              |
| ----------------- | ------------------- | ------------- | -------------------------------------------------------- |
| `web_search`      | `web_search.py`     | No            | DuckDuckGo search, returns titles + URLs + snippets      |
| `read_webpage`    | `read_webpage.py`   | No            | Fetch any URL and extract clean text (up to 12k chars)   |
| `scrape_page`     | `read_webpage.py`   | No            | CSS-selector targeted scraping with anti-bot bypass       |
| `send_email`      | `send_email.py`     | **Yes**       | Gmail SMTP dispatch (requires app password)              |
| `generate_file`   | `generate_file.py`  | **Yes**       | Write .md/.txt/.csv/.json/.html to `data/outputs/`       |

**HITL (Human-in-the-Loop):** When the agent or pipeline invokes a dangerous tool, execution pauses. The full arguments are shown to the user in the Dashboard. The task resumes only after explicit approval. The agent state (full conversation, pending tool call, token count, iteration) is serialized to the database so nothing is lost.

---

## Autopilot Pipelines

Each pipeline follows the same 4-step pattern:

```
Step 1: web_search  →  broad topic search
Step 2: web_search  →  focused follow-up search
Step 3: read_webpage →  read top 3 URLs from search results
Step 4: generate_file → compile a markdown report (triggers HITL)
```

Search queries are automatically built from the task description. The `_extract_query()` function strips common instruction prefixes ("Research...", "Create a brief on...", etc.) to extract the core search subject.

User preferences influence pipeline behavior:
- **Language** maps to DuckDuckGo search region (English → us-en, Spanish → es-es, etc.)
- **Company name** and **industry** are appended to search queries for relevance
- **Full name** and **company** appear in the generated report header

---

## Memory System

OPAS has two layers of persistent memory that are injected into every agent prompt:

### 1. Knowledge Base (Manual)

A markdown file (`data/knowledge/knowledge.md`) editable from the **Memory > Knowledge Base** tab. Contents are injected verbatim into the system prompt under `## Knowledge Base Constraints`. Use this for rules, constraints, and context that should always apply.

### 2. Agent Memory (Automatic)

After every completed task, the memory system (`memory.py`) extracts key facts and stores them in the `memories` database table. These are injected into the system prompt under `## Agent Memory` as a bullet list, capped at 2000 characters.

**Two extraction paths:**

| Path         | When Used                          | Method                                                     | Facts Extracted |
| ------------ | ---------------------------------- | ---------------------------------------------------------- | --------------- |
| **Agent**    | LLM API key is configured          | Sends last 6000 chars of conversation to LLM with a focused extraction prompt (`max_tokens=300`, `temperature=0.2`) | 2-5 per task |
| **Pipeline** | No LLM key, or pipeline-mode tasks | Deterministic: task title + category, first sentence of description, execution mode | 2-4 per task |

The agent extraction prompt asks the LLM to focus on:
- What the task was about (domain/topic)
- Key findings or data points discovered
- Tools or approaches that worked well
- User preferences or patterns observed

**Managing memories:** The **Memory > Learned** tab in the UI displays all memories with source badges (AI for agent-extracted, AUTO for pipeline-extracted), timestamps, and task IDs. Each memory can be individually deleted. Deleted memories are immediately removed from future prompts.

---

## Database Schema

All data lives in a single SQLite file: `data/assistant.db`. Tables are auto-created on first startup via `init_db()`.

### `tasks`

| Column           | Type    | Description                                          |
| ---------------- | ------- | ---------------------------------------------------- |
| `id`             | INTEGER | Primary key, auto-increment                          |
| `title`          | TEXT    | Task title (also used for pipeline matching)         |
| `description`    | TEXT    | Full task description                                |
| `status`         | TEXT    | `queued` / `running` / `waiting_for_user` / `approved` / `completed` |
| `deadline`       | TEXT    | User-set deadline (ISO string)                       |
| `budget`         | INTEGER | Token budget cap                                     |
| `category`       | TEXT    | `chief_of_staff` / `creative_agency` / `sales_intelligence` / `custom` |
| `execution_mode` | TEXT    | `agent` (LLM) or `pipeline` (zero tokens)            |
| `agent_state`    | TEXT    | JSON blob for HITL pause/resume (conversation, pending tool call, etc.) |
| `tokens_used`    | INTEGER | Running total of tokens consumed                     |
| `created_at`     | TEXT    | ISO timestamp                                        |

### `messages`

| Column              | Type    | Description                                     |
| ------------------- | ------- | ----------------------------------------------- |
| `id`                | INTEGER | Primary key                                     |
| `task_id`           | INTEGER | FK to tasks                                     |
| `sender`            | TEXT    | `agent` or `user`                               |
| `content`           | TEXT    | Message text (markdown supported)               |
| `is_approval_request` | BOOLEAN | True if this message is an HITL approval prompt |
| `msg_type`          | TEXT    | `agent` / `tool_call` / `tool_result` / `user`  |
| `created_at`        | TEXT    | ISO timestamp                                   |

### `memories`

| Column       | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| `id`         | INTEGER | Primary key                                   |
| `task_id`    | INTEGER | FK to the task that generated this memory     |
| `source`     | TEXT    | `agent` (LLM-extracted) or `pipeline` (deterministic) |
| `content`    | TEXT    | Single fact/learning as plain text            |
| `created_at` | TEXT    | ISO timestamp                                 |

### `user_preferences`

Single-row table (id=1). Lazy-initialized on first access.

| Column               | Type | Default          |
| -------------------- | ---- | ---------------- |
| `full_name`          | TEXT | `''`             |
| `email`              | TEXT | `''`             |
| `language`           | TEXT | `'English'`      |
| `company_name`       | TEXT | `''`             |
| `industry`           | TEXT | `''`             |
| `tone`               | TEXT | `'professional'` |
| `target_audience`    | TEXT | `''`             |
| `custom_instructions`| TEXT | `''`             |
| `updated_at`         | TEXT | ISO timestamp    |

---

## API Reference

All endpoints are served by FastAPI at the backend port (default 8009 in dev, 8000 in Docker).

### Tasks

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/tasks`                       | List all tasks (newest first)                |
| POST   | `/api/tasks`                       | Create a new task                            |
| GET    | `/api/tasks/{id}/messages`         | Get all messages/logs for a task             |
| POST   | `/api/tasks/{id}/messages`         | Send a message or approve an HITL request    |
| POST   | `/api/tasks/{id}/trigger`          | Manually trigger a queued task               |

### Memories

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/memories`                    | List all memories (newest first, limit 50)   |
| DELETE | `/api/memories/{id}`               | Delete a single memory                       |

### Knowledge Base

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/knowledge`                   | Get knowledge base content                   |
| POST   | `/api/knowledge`                   | Update knowledge base content                |

### Output Files

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/outputs`                     | List all generated files                     |
| GET    | `/api/outputs/{filename}`          | Download a generated file                    |
| GET    | `/api/outputs/{filename}/content`  | Get raw text content (for preview)           |

### User Preferences

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/preferences`                 | Get user preferences                         |
| POST   | `/api/preferences`                 | Update user preferences                      |

### Configuration

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/config`                      | Get all config keys with masked values       |
| POST   | `/api/config`                      | Update config overrides (immediate effect)   |

### Miscellaneous

| Method | Endpoint                           | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| POST   | `/api/tools/execute`               | Execute a safe tool directly (no LLM)        |
| GET    | `/api/pipelines`                   | List available autopilot pipelines           |

---

## Frontend Pages

The dashboard is a single-page Next.js app. Navigation is handled by the Sidebar component.

| Page              | Component          | Description                                                           |
| ----------------- | ------------------ | --------------------------------------------------------------------- |
| **Dashboard**     | `Dashboard.tsx`    | Task creation form, task queue, real-time message/log viewer with approval buttons |
| **Memory**        | `Knowledge.tsx`    | Two tabs: **Knowledge Base** (markdown editor with line numbers, Ctrl+S save) and **Learned** (auto-extracted memories with source badges, delete) |
| **Integrations**  | `Integrations.tsx` | API key management grouped by service (LLM, Email, Telegram, Slack, Discord). Shows masked values, supports live override |
| **Preferences**   | `Preferences.tsx`  | User profile form (name, email, company, industry, tone, language, audience, custom instructions) |

### Theming

Three built-in themes controlled via CSS variables in `globals.css`:

- **Dark** — default dark background with blue accents
- **Light** — clean white background
- **Aurora** — dark with green/purple gradient accents

The theme switcher is in the Sidebar footer.

---

## Project Structure

```
opas/
├── dev.py                      # Unified boot script (FastAPI + Next.js)
├── install.bat / install.sh    # One-click dependency installer
├── docker-compose.yml          # Docker deployment config
├── .env.example                # Environment variable template (documented)
├── .env                        # Your local config (git-ignored)
│
├── data/                       # Runtime data (git-ignored)
│   ├── assistant.db            # SQLite database (tasks, messages, memories, preferences)
│   ├── knowledge/
│   │   └── knowledge.md        # Agent's persistent knowledge base (auto-seeded)
│   └── outputs/                # Generated files (reports, emails, etc.)
│
└── src/
    ├── backend/
    │   ├── main.py             # FastAPI app, startup, all REST endpoints
    │   ├── core.py             # LLM engine: system prompt builder, tool-calling via LiteLLM
    │   ├── database.py         # SQLite CRUD: tasks, messages, memories, preferences
    │   ├── worker.py           # Background daemon: polls tasks, routes to agent/pipeline
    │   ├── memory.py           # Automatic memory extraction (LLM + deterministic fallback)
    │   ├── pipelines.py        # 12 pre-built LLM-free pipelines with HITL support
    │   ├── agent.py            # Agent reasoning loop (legacy)
    │   ├── skills_loader.py    # Skill markdown loader (legacy)
    │   ├── skills/
    │   │   ├── email_manager/
    │   │   │   └── skill.md    # Email Manager skill definition
    │   │   └── web_researcher/
    │   │       └── skill.md    # Web Researcher skill definition
    │   └── tools/
    │       ├── __init__.py
    │       ├── registry.py     # Tool schemas, executor map, HITL classification
    │       ├── web_search.py   # DuckDuckGo search implementation
    │       ├── read_webpage.py # URL fetching + CSS selector scraping
    │       ├── send_email.py   # Gmail SMTP dispatch
    │       └── generate_file.py# Output file writer
    │
    └── frontend/
        ├── package.json
        ├── next.config.ts      # API proxy → backend
        ├── tailwind.config.ts
        └── src/
            ├── app/
            │   ├── layout.tsx      # Root layout (fonts, metadata)
            │   ├── page.tsx        # Main SPA shell (Sidebar + active page)
            │   └── globals.css     # Theme system (Dark / Light / Aurora)
            └── components/
                ├── Sidebar.tsx     # Navigation, task queue, theme switcher
                ├── Dashboard.tsx   # Task creation + message viewer + HITL approvals
                ├── Knowledge.tsx   # Knowledge Base editor + Learned memories tab
                ├── Integrations.tsx# Live API key management
                ├── Preferences.tsx # User profile form
                └── Logo.tsx        # OPAS logo component
```

---

## Roadmap

- [x] Next.js + FastAPI full-stack architecture
- [x] Tool-based agent engine with function calling
- [x] SQLite task & message persistence
- [x] Human-in-the-Loop (HITL) approval intercepts with state serialization
- [x] Persistent Knowledge Base with auto-injection
- [x] Automatic Agent Memory (LLM extraction + pipeline fallback)
- [x] User preferences with prompt personalization
- [x] 12 Autopilot pipelines across 3 domains (zero tokens)
- [x] OPAS branding + multi-theme system (Dark / Light / Aurora)
- [x] General config management (`.env` + live UI override)
- [x] Token budget tracking per task
- [x] Web search tool (DuckDuckGo)
- [x] Page reading + CSS scraping tools
- [x] Email dispatch tool (Gmail SMTP)
- [x] File generation tool (.md, .txt, .csv, .json, .html)
- [x] Docker Compose deployment
- [ ] Telegram notification skill
- [ ] Slack messaging skill
- [ ] Discord messaging skill
- [ ] Scheduled / recurring tasks
- [ ] Multi-agent collaboration
- [ ] Plugin marketplace
