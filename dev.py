import sys
import subprocess
import os
import signal
import time

def main():
    print("==============================================")
    print("  Synapse Layer - Fullstack DEV MODE")
    print("==============================================\n")
    
    # 1. Start Python Backend (FastAPI + Worker)
    print("[SYSTEM] Booting Python Engine (Port 8000)...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "src.backend.agent"],
        cwd=os.getcwd()
    )
    
    # Give the backend a second to bind to the port
    time.sleep(2)
    
    # 2. Start Next.js Frontend (React UI)
    frontend_dir = os.path.join(os.getcwd(), "src", "frontend")
    print("[SYSTEM] Booting Next.js Interface (Port 3000)...")
    
    # We use shell=True on Windows/WSL to ensure npm resolves correctly
    # pass as a single string so the shell interprets it exactly
    frontend_process = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True
    )
    
    try:
        # Keep the parent script alive while the children run
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n\n[INFO] Graceful Shutdown Initiated (Ctrl-C).")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
