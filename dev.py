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
    print("[SYSTEM] Booting Python Engine (Background Service)...")
    # Redirect backend output to a hidden log file to keep the terminal clean
    log_file = open("backend_service.log", "w")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "src.backend.agent"],
        cwd=os.getcwd(),
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    
    # Give the backend a second to bind to the port
    time.sleep(2)
    
    # 2. Start Next.js Frontend (React UI) on Port 80
    frontend_dir = os.path.join(os.getcwd(), "src", "frontend")
    print("[SYSTEM] Booting Next.js Interface (Port 80)...")
    
    # We use shell=True on Windows/WSL to ensure npm resolves correctly
    # Pass -- -p 80 to force Next.js to use port 80
    frontend_process = subprocess.Popen(
        "npm run dev -- -p 80",
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
        log_file.close()
        sys.exit(0)
        sys.exit(0)

if __name__ == "__main__":
    main()
