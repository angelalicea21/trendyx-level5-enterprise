@echo off
echo ====================================
echo TrendyX Level 5 - Railway Deployment
echo Full Power Mode - 64 Qubits Engaged
echo ====================================
echo.

echo Step 1: Installing Railway CLI (if needed)...
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Railway CLI not found. Installing...
    npm install -g @railway/cli
) else (
    echo Railway CLI already installed!
)

echo.
echo Step 2: Logging into Railway...
railway login

echo.
echo Step 3: Creating new Railway project...
railway init -n trendyx-level5-enterprise

echo.
echo Step 4: Setting environment variables...
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set NODE_OPTIONS="--max-old-space-size=8192"

echo.
echo Step 5: Checking for API keys in .env file...
if exist .env (
    echo Found .env file. Setting API keys...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        railway variables set %%a="%%b"
    )
) else (
    echo WARNING: No .env file found!
    echo You'll need to set API keys manually in Railway dashboard
)

echo.
echo Step 6: Deploying to Railway...
railway up

echo.
echo ====================================
echo Deployment initiated!
echo ====================================
echo.
echo Your app will be available at:
echo https://trendyx-level5-enterprise.railway.app
echo.
echo To view logs: railway logs
echo To open dashboard: railway open
echo.
echo Full Power Configuration:
echo - 64 Quantum Qubits
echo - 4096 Neural Connections
echo - 8GB Memory Available
echo - All Features Enabled
echo.
pause