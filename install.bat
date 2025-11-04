@echo off
setlocal

echo ==============================================
echo   OPAS - Autonomous Personal Assistant Setup
echo ==============================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] python is not installed or not in PATH.
    echo Please install Python 3.10+ to continue.
    pause
    exit /b 1
)
echo [OK] Python detected.

:: 2. Check for Node.js / npm
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    echo This project requires Node.js v20+ to compile the Next.js frontend.
    pause
    exit /b 1
)
echo [OK] npm detected.
echo.

echo [1/2] Installing Backend Dependencies (Python) ...
echo ==============================================
if not exist "venv\" (
    echo Creating virtual environment 'venv'...
    python -m venv venv
)

:: Activate venv and install dependencies
call venv\Scripts\activate.bat
pip install -r src\backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

echo.
echo [2/2] Installing Frontend Dependencies (Node.js) ...
echo ==============================================
cd src\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies.
    pause
    exit /b 1
)
cd ..\..

echo.
echo ==============================================
echo [SUCCESS] Installation Complete!
echo ==============================================
echo.
echo You can now boot OPAS in local development mode by running:
echo   venv\Scripts\activate.bat
echo   python dev.py
echo.

pause
