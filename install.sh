#!/bin/bash

echo "=============================================="
echo "  Autonomous Personal Assistant - Setup  "
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo ""
    echo "[ERROR] Docker is not installed or not in PATH."
    echo "This assistant requires Docker to run securely."
    echo ""
    
    # Identify OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Please download and install Docker Desktop for Mac from:"
        echo "https://docs.docker.com/desktop/install/mac-install/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Please install Docker for Linux via your package manager."
        echo "E.g., for Ubuntu: sudo apt-get install docker.io docker-compose"
    else
        echo "Please install Docker for your OS from https://docs.docker.com/get-docker/"
    fi
    echo ""
    echo "After installing and starting Docker, run this script again."
    exit 1
fi

echo ""
echo "[OK] Docker is installed. Starting the assistant..."
echo ""

# Fallback checking docker-compose or docker compose
if command -v docker-compose &> /dev/null
then
    docker-compose up -d --build
elif docker compose version &> /dev/null
then
    docker compose up -d --build
else
    echo "[ERROR] 'docker compose' is not available. Please install it."
    exit 1
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to start the assistant. Please ensure the Docker daemon is running."
    exit 1
fi

echo ""
echo "=============================================="
echo "[SUCCESS] The Assistant is starting up!       "
echo "=============================================="
echo ""
echo "Waiting a few seconds for the local UI to boot..."
sleep 5

# Attempt to open the local dashboard
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
else
    echo "Please open http://localhost:3000 in your browser to configure your API keys."
fi
