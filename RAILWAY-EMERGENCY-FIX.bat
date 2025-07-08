@echo off
echo ====================================
echo RAILWAY EMERGENCY FIX
echo ====================================
echo.

echo Step 1: Creating proper .gitignore...
(
echo node_modules/
echo .env
echo *.log
echo .DS_Store
echo npm-debug.log*
echo package-lock.json
) > .gitignore

echo.
echo Step 2: Removing node_modules from git...
git rm -r --cached node_modules/ 2>nul

echo.
echo Step 3: Creating minimal package.json...
(
echo {
echo   "name": "trendyx-level5",
echo   "version": "1.0.0",
echo   "main": "server-minimal.js",
echo   "scripts": {
echo     "start": "node server-minimal.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2"
echo   },
echo   "engines": {
echo     "node": ">=16.0.0"
echo   }
echo }
) > package.json

echo.
echo Step 4: Creating Procfile for minimal server...
echo web: node server-minimal.js > Procfile

echo.
echo Step 5: Creating railway.json for minimal config...
(
echo {
echo   "build": {
echo     "builder": "NIXPACKS"
echo   },
echo   "deploy": {
echo     "numReplicas": 1,
echo     "startCommand": "node server-minimal.js",
echo     "restartPolicyType": "ON_FAILURE",
echo     "restartPolicyMaxRetries": 3
echo   }
echo }
) > railway.json

echo.
echo Step 6: Adding all changes to git...
git add .gitignore
git add package.json
git add Procfile
git add railway.json
git add server-minimal.js

echo.
echo Step 7: Committing changes...
git commit -m "Emergency fix - deploy minimal server"

echo.
echo Step 8: Deploying to Railway...
railway up

echo.
echo ====================================
echo If deployment succeeds, you'll see:
echo "Server running on port XXXX"
echo ====================================
echo.
echo Next steps after success:
echo 1. Visit your Railway URL
echo 2. Check /api/health endpoint
echo 3. Gradually add features back
echo.
pause