import sys
import subprocess
import os
import signal
import time

class C:
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

    # Enable ANSI colors on Windows automatically using os.system
    if os.name == 'nt':
        os.system('color')

def main():
    print(f"{C.CYAN}{C.BOLD}=============================================={C.END}")
    print(f"{C.BLUE}{C.BOLD}      ██████╗ ██████╗  █████╗ ███████╗        {C.END}")
    print(f"{C.BLUE}{C.BOLD}      ██╔═══██╗██╔══██╗██╔══██╗██╔════╝        {C.END}")
    print(f"{C.BLUE}{C.BOLD}      ██║   ██║██████╔╝███████║███████╗        {C.END}")
    print(f"{C.BLUE}{C.BOLD}      ██║   ██║██╔═══╝ ██╔══██║╚════██║        {C.END}")
    print(f"{C.BLUE}{C.BOLD}      ╚██████╔╝██║     ██║  ██║███████║        {C.END}")
    print(f"{C.BLUE}{C.BOLD}       ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝        {C.END}")
    print(f"{C.CYAN}{C.BOLD}=============================================={C.END}")
    print(f"{C.CYAN}{C.BOLD}          OPAS - Autonomous Agent             {C.END}")
    print(f"{C.CYAN}{C.BOLD}=============================================={C.END}\n")
    
    # 0. Environment & Dependency Checks
    print(f"{C.YELLOW}[SYSTEM]{C.END} Verifying Environment...")
    frontend_dir = os.path.join(os.getcwd(), "src", "frontend")
    backend_reqs = os.path.join(os.getcwd(), "src", "backend", "requirements.txt")
    
    # Auto-install Python dependencies if venv is missing
    if not os.path.exists("venv"):
        print(f"{C.YELLOW}[SYSTEM]{C.END} 'venv' not found. Creating Python Virtual Environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print(f"{C.YELLOW}[SYSTEM]{C.END} Installing OPAS backend dependencies...")
        
        # Determine the correct pip path based on OS
        if os.name == 'nt':
            pip_path = os.path.join("venv", "Scripts", "pip")
        else:
            pip_path = os.path.join("venv", "bin", "pip")
            
        subprocess.run([pip_path, "install", "-r", backend_reqs], check=True)
        subprocess.run([pip_path, "install", "-r", backend_reqs], check=True)
        print(f"{C.GREEN}[OK]{C.END} Python Backend modules installed.\n")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print(f"{C.YELLOW}[SYSTEM]{C.END} Installing missing Next.js dependencies (this may take a minute)...")
        subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
        print(f"{C.GREEN}[OK]{C.END} Node modules installed.\n")
    
    # 1. Start Python Backend (FastAPI + Worker)
    print(f"{C.CYAN}[SYSTEM]{C.END} Booting Python Engine {C.GREEN}(Background Service){C.END}...")
    # Redirect backend output to a hidden log file to keep the terminal clean
    log_file = open("backend_service.log", "w")
    backend_process = subprocess.Popen(
        [sys.executable, "-c", "import uvicorn; uvicorn.run('src.backend.main:app', host='0.0.0.0', port=8000)"],
        cwd=os.getcwd(),
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    
    # Give the backend a second to bind to the port
    time.sleep(2)
    
    # 2. Start Next.js Frontend (React UI) on Port 80
    print(f"{C.CYAN}[SYSTEM]{C.END} Booting Next.js Interface {C.GREEN}(Port 80){C.END}...")
    
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
        print(f"\n\n{C.YELLOW}[INFO]{C.END} Graceful Shutdown Initiated (Ctrl-C).")
        backend_process.terminate()
        frontend_process.terminate()
        log_file.close()
        sys.exit(0)
        sys.exit(0)

if __name__ == "__main__":
    main()
