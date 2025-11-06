# OPAS - Autonomous Personal Assistant

A highly secure, locally-managed autonomous personal assistant that handles intelligent background tasks, web research, and operations. It is designed to be incredibly simple to install for beginners while offering a top-tier local development experience for hackers with a modern `Next.js` and `FastAPI` architecture.

## 🚀 Features

- **Decoupled Architecture:** A beautiful Next.js Glassmorphism frontend running independently of a resilient Python FastAPI background engine.
- **Anthropic Skill Engine:** Built on the modern AI paradigm of discrete "Skills" rather than hardcoded logical loops.
- **Model Agnostic:** Plug in OpenAI, Anthropic, or run models locally.
- **Persistent Memory Directives:** A local neural vault that stores context and behavioral constraints over time.

## 🛠️ Installation (For End Users)

The philosophy of this project is a **"One-Click Setup"** for non-technical users looking to run the agent locally.

1. Ensure [Python 3.10+](https://www.python.org/downloads/) and [Node.js v20+](https://nodejs.org/en) are installed on your machine.
2. Download or clone this repository.
3. Edit the `.env` file and add your `OPENAI_API_KEY`.
4. Run the installer script for your Operating System:
   - **Windows:** Double-click `install.bat`
   - **Mac/Linux:** Run `./install.sh` in your terminal.

The installer will automatically create a secure Python Virtual Environment, install the required `pip` backend libraries, and install the `npm` frontend framework.

## 💻 Local Development & Execution

To boot the OPAS assistant and access the local control panel, you only need to run one unified command.

Make sure you have activated your virtual environment:

```bash
# Mac/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

Then run the intelligent development boot script:

```bash
python3 dev.py
```

`dev.py` will automatically check for missing dependencies, silently boot the FastAPI Python background engine, and launch the Next.js `OPAS` Operations Dashboard securely at `http://localhost`.

## 🔑 Getting Your API Keys

- **Telegram Bot Token:** Open the Telegram app, search for `@BotFather`, send the `/newbot` command, choose a name, and copy the HTTP API Token it provides.
- **LLM Key:** Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/).

## 🗺️ Roadmap

- [x] Fullstack Migration (Next.js + FastAPI)
- [x] Anthropic Skills Architecture Implementation
- [x] OPAS Branding & Dark Aurora Theme
- [x] Automated Local Python & Node Setup Scripts
- [ ] Implement Autonomous Tools (Web Search, File Reading)
- [ ] Refine Cryptographic HITL (Human-in-the-Loop) Intercepts
