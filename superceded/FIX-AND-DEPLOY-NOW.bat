@echo off
echo ====================================
echo EMERGENCY FIX FOR RAILWAY
echo ====================================
echo.

echo Step 1: Fixing package.json to use server-railway.js...
powershell -Command "(gc package.json) -replace '\"start\": \"node server.js\"', '\"start\": \"node server-railway.js\"' | Out-File -encoding ASCII package.json"

echo.
echo Step 2: Creating railway.toml to override start command...
echo [deploy] > railway.toml
echo startCommand = "node server-railway.js" >> railway.toml

echo.
echo Step 3: Adding memory limit to package.json...
powershell -Command "(gc package.json) -replace '\"node server-railway.js\"', '\"node --max-old-space-size=8192 server-railway.js\"' | Out-File -encoding ASCII package.json"

echo.
echo Step 4: Git add all changes...
git add package.json
git add railway.toml
git add server-railway.js
git add neural-networks/neural-network-fix.js

echo.
echo Step 5: Commit changes...
git commit -m "EMERGENCY FIX: Use server-railway.js and add memory limits"

echo.
echo Step 6: Push to Railway...
railway up

echo.
echo ====================================
echo DEPLOYMENT STARTED!
echo ====================================
echo.
echo IMPORTANT REMINDERS:
echo 1. Make sure you added environment variables in Railway dashboard
echo 2. Watch the logs: railway logs
echo 3. Your app will be at the Railway URL shown above
echo.
pause