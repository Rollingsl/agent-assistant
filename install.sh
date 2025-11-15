#!/bin/bash

echo "=============================================="
echo "  OPAS - Autonomous Personal Assistant Setup  "
echo "=============================================="
echo ""

# 1. Check for Python
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] python3 is not installed or not in PATH."
    echo "Please install Python 3.10+ to continue."
    exit 1
fi
echo "[OK] Python 3 detected."

# 2. Check for Node.js / npm
if ! command -v npm &> /dev/null
then
    echo "[ERROR] npm is not installed or not in PATH."
    echo "This project requires Node.js v20+ to compile the Next.js frontend."
    exit 1
fi
echo "[OK] npm detected."

echo ""
echo "[1/2] Installing Backend Dependencies (Python) ..."
echo "=============================================="
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'..."
    python3 -m venv venv
fi

# Use the explicit path to the venv pip binary
./venv/bin/pip install -r src/backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python dependencies."
    exit 1
fi

echo ""
echo "[2/2] Installing Frontend Dependencies (Node.js) ..."
echo "=============================================="
cd src/frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Node.js dependencies."
    exit 1
fi
cd ../..

echo ""
echo "=============================================="
echo "[SUCCESS] Installation Complete!"
echo "=============================================="
echo ""
echo "You can now boot OPAS in local development mode by running:"
echo "  ./venv/bin/python dev.py"
echo ""
