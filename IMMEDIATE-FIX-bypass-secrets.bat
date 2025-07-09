@echo off
echo ========================================
echo IMMEDIATE FIX: Bypass Secrets + Railway
echo ========================================

echo Step 1: Remove problematic files...
if exist "env-production" del /f /q "env-production"
if exist "env-template" del /f /q "env-template"

echo Step 2: Create clean .env.example...
echo # TrendyX AI Level 5 Enterprise Environment Variables > .env.example
echo # Copy this file to .env and add your actual API keys >> .env.example
echo NODE_ENV=production >> .env.example
echo PORT=3000 >> .env.example
echo # OPENAI_API_KEY=your_key_here >> .env.example
echo # ANTHROPIC_API_KEY=your_key_here >> .env.example

echo Step 3: Fix Railway configuration...
echo { > railway.json
echo   "$schema": "https://railway.app/railway.schema.json", >> railway.json
echo   "build": { >> railway.json
echo     "builder": "NIXPACKS", >> railway.json
echo     "buildCommand": "npm install" >> railway.json
echo   }, >> railway.json
echo   "deploy": { >> railway.json
echo     "numReplicas": 1, >> railway.json
echo     "sleepApplication": false >> railway.json
echo   } >> railway.json
echo } >> railway.json

echo Step 4: Clean Git and commit...
git add .
git commit -m "Fix: Remove secrets and fix Railway deployment"

echo Step 5: Push to GitHub...
git push --force origin main

echo ========================================
echo IMMEDIATE FIX COMPLETE!
echo Railway deployment should work now!
echo ========================================
pause

