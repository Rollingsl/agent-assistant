import os
import threading
from dotenv import load_dotenv

from src.backend.main import start_web_server
from src.backend.worker import process_background_tasks

def main() -> None:
    load_dotenv()
    
    print("==============================================")
    print("  Initializing Autonomous Background Engine...")
    print("==============================================")
    
    # Check OpenAI Key status
    llm_key = os.getenv("OPENAI_API_KEY")
    if not llm_key or llm_key == "your_openai_api_key_here":
        print("[WARNING] OPENAI_API_KEY is missing. Operating strictly via local templates for now.")
    
    # 1. Start the Background Worker Thread (Autonomous Execution Engine)
    # This thread runs permanently in the background alongside the web server,
    # waking up to handle any queued tasks regardless of user availability.
    worker_thread = threading.Thread(target=process_background_tasks, daemon=True)
    worker_thread.start()
        
    # 2. Start Web Dashboard on the main thread
    print("\n[SUCCESS] Booting Operations Dashboard at http://localhost:3000")
    start_web_server()

if __name__ == '__main__':
    main()
