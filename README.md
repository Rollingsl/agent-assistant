# Autonomous Personal Assistant

A highly secure, locally-managed autonomous personal assistant that handles messaging, calls, and more. It is designed to be incredibly simple to install for beginners while offering a top-tier local development experience for hackers.

## 🚀 Features (So Far)

- **Isolated & Secure:** Runs inside a Docker container (acting as a lightweight hypervisor) so it cannot access or harm your host machine.
- **Model Agnostic:** Uses `litellm` under the hood. You can easily plug in OpenAI, Anthropic, or run Llama 3 locally via Ollama.
- **Telegram Interface:** No complex UI needed yet. You chat directly with your assistant securely through the Telegram app on your phone or desktop.

## 🛠️ Installation (For End Users)

The philosophy of this project is a **"One-Click Setup"** for non-technical users.

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed on your machine.
2. Download or clone this repository.
3. Edit the `.env` file and add your `OPENAI_API_KEY` and `TELEGRAM_BOT_TOKEN`.
4. Run the installer script for your Operating System:
   - **Windows:** Double-click `install.bat`
   - **Mac/Linux:** Run `./install.sh` in your terminal.

The installer will automatically verify Docker is running, build the secure container, and boot your assistant in the background.

## 💻 Local Development (For Hackers)

If you are developing new features and don't want to rebuild the Docker image after every line of code change, you can run the assistant directly on your host machine.

### Prerequisites

Make sure you have Python 3.11+ installed.

1. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```
3. Run the fast dev script to boot the assistant locally without Docker:
   ```bash
   python dev.py
   ```

## 🔑 Getting Your API Keys

- **Telegram Bot Token:** Open the Telegram app, search for `@BotFather`, send the `/newbot` command, choose a name, and copy the HTTP API Token it provides.
- **LLM Key:** Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/).

## 🗺️ Roadmap

- [x] Dockerized Secure Environment
- [x] Basic Telegram Messaging Interface
- [x] Easy Windows/Mac/Linux Install Scripts
- [x] Fast Local Dev Script (`dev.py`)
- [ ] Add a Local Web UI Control Panel (for pasting keys easily)
- [ ] Implement Autonomous Tools (Web Search, File Reading)
- [ ] Add Call Handling and Voice via Twilio API
