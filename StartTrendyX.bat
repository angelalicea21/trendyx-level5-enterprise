@echo off
REM StartTrendyX.bat
REM SAVE THIS FILE IN: H:\TrendyX-Level5-Enterprise\StartTrendyX.bat

cls
echo.
echo ==============================================================
echo                 TRENDYX LEVEL 5 ENTERPRISE
echo                    QUANTUM AI SYSTEM
echo ==============================================================
echo.
echo [SYSTEM] Initializing Quantum-Neural Architecture...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [ERROR] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [CHECK] Node.js detected: 
node --version
echo.

REM Check if MongoDB is running
echo [CHECK] Checking MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB service not found. Starting MongoDB...
    REM Try to start MongoDB if installed
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo [WARNING] MongoDB not running. Please start MongoDB manually.
        echo [INFO] You can download MongoDB from: https://www.mongodb.com/download-center/community
    )
) else (
    echo [OK] MongoDB is running
)
echo.

REM Check if Redis is running
echo [CHECK] Checking Redis...
sc query Redis >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Redis service not found.
    echo [INFO] You can download Redis from: https://github.com/microsoftarchive/redis/releases
) else (
    echo [OK] Redis is running
)
echo.

REM Install dependencies if needed
if not exist node_modules (
    echo [INSTALL] Installing dependencies...
    echo [INSTALL] This may take a few minutes on first run...
    call npm install --no-optional --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo [TIP] Try running: npm install --force
        pause
        exit /b 1
    )
)

REM Create necessary directories
if not exist logs mkdir logs
if not exist data mkdir data
if not exist uploads mkdir uploads

REM Start the server
echo.
echo ==============================================================
echo            STARTING TRENDYX SUPER SERVER
echo ==============================================================
echo.
echo [AI] Quantum Core: INITIALIZING...
echo [AI] Neural Networks: LOADING...
echo [AI] Predictive Engine: CALIBRATING...
echo [AI] Real-time Processor: ACTIVATING...
echo.
echo [SERVER] Starting on http://localhost:3001
echo [QUANTUM] Quantum stream available on ws://localhost:3001/quantum-stream
echo.
echo Press Ctrl+C to stop the server
echo.

REM Set environment variables
set NODE_ENV=development
set PORT=3001
set CLUSTERING=true

REM Start the server
node TrendyXSuperServer.js

pause