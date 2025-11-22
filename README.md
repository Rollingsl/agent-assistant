# OPAS — Autonomous Personal Agent System

> A locally-hosted, privacy-first autonomous agent with a modern Next.js dashboard and FastAPI backend. Delegate tasks with a deadline and token budget — OPAS executes them in the background using a skill-based architecture, requesting your approval before any irreversible action.

---

## ✨ Features

| Feature            | Description                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| **Skill Engine**   | Modular discrete skills (web research, email, etc.) loaded at runtime        |
| **HITL Safety**    | Human-in-the-Loop intercepts for high-risk actions (email sends, payments)   |
| **Knowledge Base** | Persistent long-term memory injected into every agent context                |
| **Model Agnostic** | Works with OpenAI, Anthropic, or local Ollama models via LiteLLM             |
| **Theme System**   | Dark / Light / Aurora themes with full CSS variable theming                  |
| **General Config** | All credentials configurable via `.env` file or live UI override per session |

---

## 🚀 Quick Start

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

Open **http://localhost:3000** to access the OPAS Operations Dashboard.

---

## 🔑 Configuration

All credentials are read from `.env` at startup. You can also override any value **live** via the **API & Integrations** panel in the UI — no restart needed.

See [`.env.example`](.env.example) for all available variables with inline documentation.

### Minimum required

```env
OPENAI_API_KEY=sk-...      # Or any LiteLLM-compatible key
LLM_MODEL=gpt-4o-mini
```

### Getting your API keys

| Service                | Where to get it                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**             | [platform.openai.com/api-keys](https://platform.openai.com/api-keys)               |
| **Anthropic**          | [console.anthropic.com](https://console.anthropic.com/)                            |
| **Gmail App Password** | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)     |
| **Telegram Bot Token** | Message [@BotFather](https://t.me/botfather) on Telegram → `/newbot`               |
| **Slack Bot Token**    | [api.slack.com/apps](https://api.slack.com/apps) — create app, add scopes, install |
| **Discord Bot Token**  | [discord.com/developers/applications](https://discord.com/developers/applications) |

---

## 🗂️ Project Structure

```
assistant/
├── dev.py                  # Unified boot script (starts both services)
├── install.bat / .sh       # One-click installer scripts
├── .env.example            # Environment variable template
├── data/
│   ├── assistant.db        # SQLite task/message database (auto-created)
│   └── knowledge/
│       └── knowledge.md    # Agent's persistent knowledge base (auto-seeded)
└── src/
    ├── backend/
    │   ├── main.py         # FastAPI app + all API endpoints
    │   ├── core.py         # LLM inference engine (LiteLLM)
    │   ├── database.py     # SQLite helpers
    │   ├── worker.py       # Background task executor
    │   ├── agent.py        # Agent reasoning loop
    │   └── skills_loader.py
    └── frontend/
        └── src/
            ├── app/
            │   ├── page.tsx        # Main SPA layout
            │   └── globals.css     # Theme variables (Dark/Light/Aurora)
            └── components/
                ├── Sidebar.tsx     # Navigation, task queue, theme switcher
                ├── Dashboard.tsx   # Task message/log viewer
                ├── Integrations.tsx # API credential management
                └── Knowledge.tsx   # Knowledge base editor
```

---

## 🗺️ Roadmap

- [x] Next.js + FastAPI full-stack architecture
- [x] Skill-based agent engine
- [x] SQLite task & message persistence
- [x] Human-in-the-Loop (HITL) approval intercepts
- [x] Persistent Knowledge Base with auto-injection
- [x] OPAS branding + multi-theme system (Dark / Light / Aurora)
- [x] General config management (`.env` + live UI override)
- [x] Immediate task trigger from queued state
- [ ] Web search skill (Serper/DuckDuckGo)
- [ ] File reading skill
- [ ] Email dispatch skill (Gmail)
- [ ] Telegram notification skill
- [ ] Docker one-command deployment
