import sys
import subprocess
import os
import signal
import time

def main():
    print("==============================================")
    print("      ██████╗ ██████╗  █████╗ ███████╗        ")
    print("      ██╔═══██╗██╔══██╗██╔══██╗██╔════╝        ")
    print("      ██║   ██║██████╔╝███████║███████╗        ")
    print("      ██║   ██║██╔═══╝ ██╔══██║╚════██║        ")
    print("      ╚██████╔╝██║     ██║  ██║███████║        ")
    print("       ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝        ")
    print("==============================================")
    print("          OPAS - Autonomous Agent             ")
    print("==============================================\n")
    
    # 0. Environment & Dependency Checks
    print("[SYSTEM] Verifying Environment...")
    frontend_dir = os.path.join(os.getcwd(), "src", "frontend")
    backend_reqs = os.path.join(os.getcwd(), "src", "backend", "requirements.txt")
    
    # Auto-install Python dependencies if venv is missing
    if not os.path.exists("venv"):
        print("[SYSTEM] 'venv' not found. Creating Python Virtual Environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("[SYSTEM] Installing OPAS backend dependencies...")
        
        # Determine the correct pip path based on OS
        if os.name == 'nt':
            pip_path = os.path.join("venv", "Scripts", "pip")
        else:
            pip_path = os.path.join("venv", "bin", "pip")
            
        subprocess.run([pip_path, "install", "-r", backend_reqs], check=True)
        print("[OK] Python Backend modules installed.\n")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("[SYSTEM] Installing missing Next.js dependencies (this may take a minute)...")
        subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
        print("[OK] Node modules installed.\n")
    
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
