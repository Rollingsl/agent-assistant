@echo off
setlocal

echo ==============================================
echo   Autonomous Personal Assistant - Setup
echo ==============================================

:: Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker is not installed or not running.
    echo This assistant requires Docker Desktop to run securely.
    echo.
    echo Please download and install Docker Desktop for Windows from:
    echo https://docs.docker.com/desktop/install/windows-install/
    echo.
    echo After installing and starting Docker Desktop, run this script again.
    pause
    exit /b 1
)

echo.
echo [OK] Docker is installed. Starting the assistant...
echo.

:: Run docker-compose
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the assistant. Please ensure Docker engine is running.
    pause
    exit /b 1
)

echo.
echo ==============================================
echo [SUCCESS] The Assistant is starting up!
echo ==============================================
echo.
echo We will now open the Local Control Panel in your browser.
echo Please configure your API keys there to begin.
echo.

:: Wait a few seconds for the web server to boot
timeout /t 5 /nobreak >nul

:: Open the default browser to the local UI
start http://localhost:3000

pause
