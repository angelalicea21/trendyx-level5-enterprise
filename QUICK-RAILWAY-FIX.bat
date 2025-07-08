@echo off
echo ====================================
echo Quick Railway Fix
echo ====================================
echo.

echo Step 1: Installing dependencies to create package-lock.json...
npm install

echo.
echo Step 2: Installing chalk for monitor...
npm install chalk

echo.
echo Step 3: Updating package.json to use server-railway.js...
echo Make sure your package.json has "start": "node server-railway.js"

echo.
echo Step 4: Add to git...
git add package-lock.json
git add package.json
git add server-railway.js
git add railway.json

echo.
echo Step 5: Commit changes...
git commit -m "Fix Railway deployment - add lock file and server"

echo.
echo Step 6: Deploy to Railway...
railway up

echo.
echo ====================================
echo IMPORTANT: Set environment variables!
echo ====================================
echo.
echo 1. Go to your Railway dashboard
echo 2. Click Variables tab
echo 3. Add all your API keys there
echo.
echo Your app URL will be shown after deployment
echo.
pause