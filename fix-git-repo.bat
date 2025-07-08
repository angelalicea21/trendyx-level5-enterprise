@echo off
echo ====================================
echo GIT REPOSITORY EMERGENCY CLEANUP
echo ====================================
echo.

echo Step 1: Creating proper .gitignore...
(
echo # Dependencies
echo node_modules/
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo.
echo # Environment variables
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo.
echo # Production
echo /build
echo /dist
echo.
echo # Misc
echo .DS_Store
echo *.log
echo.
echo # IDE
echo .vscode/
echo .idea/
) > .gitignore

echo Step 2: Removing ALL node_modules from git...
git rm -rf --cached node_modules/
git rm -rf --cached .env

echo Step 3: Staging all changes...
git add .gitignore
git add -A

echo Step 4: Committing clean repository...
git commit -m "Clean repository - remove node_modules, add proper gitignore"

echo Step 5: Creating minimal package.json for testing...
(
echo {
echo   "name": "trendyx-level5-enterprise",
echo   "version": "1.0.0",
echo   "description": "AI-powered TrendyX Enterprise Platform",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.0.3"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   }
echo }
) > package-minimal.json

echo.
echo ✅ Git repository cleaned!
echo ✅ Run this next: copy package-minimal.json package.json
echo ✅ Then: npm install
echo ✅ Finally: railway up
pause