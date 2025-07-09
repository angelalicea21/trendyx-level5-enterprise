@echo off
color 0A
cls

echo ================================================
echo    TRENDYX AI ENTERPRISE - COMPLETE FIX TOOL
echo ================================================
echo.

:: Navigate to TrendyX directory
cd /d C:\TrendyX-Level4-Enterprise

echo [STEP 1] Checking current directory...
echo Current location: %CD%
echo.

echo [STEP 2] Backing up current .env file...
if exist .env (
    copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt
    echo Backup created!
) else (
    echo No .env file found - will create new one
)
echo.

echo [STEP 3] Please enter your API keys:
echo.
set /p OPENAI_KEY="Enter your OpenAI API Key (starts with sk-): "
set /p ANTHROPIC_KEY="Enter your Anthropic API Key: "
echo.

echo [STEP 4] Creating new .env file with your keys...
(
echo # TRENDYX AI CONFIGURATION
echo # Generated on %date% at %time%
echo.
echo # API KEYS
echo OPENAI_API_KEY=%OPENAI_KEY%
echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY%
echo.
echo # SERVER CONFIG
echo NODE_ENV=production
echo PORT=3000
echo BASE_URL=http://localhost:3000
echo.
echo # SECURITY
echo JWT_SECRET=trendyx-jwt-secret-%random%%random%%random%
echo SESSION_SECRET=trendyx-session-%random%%random%%random%
echo.
echo # DATABASE
echo DATABASE_URL=sqlite://./database.sqlite
echo.
echo # FEATURES
echo ENABLE_REGISTRATION=true
echo ENABLE_API_ACCESS=true
echo RATE_LIMIT_WINDOW=15
echo RATE_LIMIT_MAX_REQUESTS=100
) > .env

echo New .env file created!
echo.

echo [STEP 5] Installing/updating dependencies...
call npm install
echo.

echo [STEP 6] Testing API connections...
echo.

:: Create a test script
echo const OpenAI = require('openai'); > test-apis.js
echo const Anthropic = require('@anthropic-ai/sdk'); >> test-apis.js
echo require('dotenv').config(); >> test-apis.js
echo. >> test-apis.js
echo console.log('Testing API connections...'); >> test-apis.js
echo. >> test-apis.js
echo const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); >> test-apis.js
echo const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); >> test-apis.js
echo. >> test-apis.js
echo async function testAPIs() { >> test-apis.js
echo   try { >> test-apis.js
echo     console.log('Testing OpenAI...'); >> test-apis.js
echo     const openaiTest = await openai.models.list(); >> test-apis.js
echo     console.log('✓ OpenAI connected successfully!'); >> test-apis.js
echo   } catch (error) { >> test-apis.js
echo     console.log('✗ OpenAI error:', error.message); >> test-apis.js
echo   } >> test-apis.js
echo. >> test-apis.js
echo   try { >> test-apis.js
echo     console.log('Testing Anthropic...'); >> test-apis.js
echo     const anthropicTest = await anthropic.messages.create({ >> test-apis.js
echo       model: 'claude-3-haiku-20240307', >> test-apis.js
echo       messages: [{role: 'user', content: 'Hi'}], >> test-apis.js
echo       max_tokens: 10 >> test-apis.js
echo     }); >> test-apis.js
echo     console.log('✓ Anthropic connected successfully!'); >> test-apis.js
echo   } catch (error) { >> test-apis.js
echo     console.log('✗ Anthropic error:', error.message); >> test-apis.js
echo   } >> test-apis.js
echo } >> test-apis.js
echo. >> test-apis.js
echo testAPIs(); >> test-apis.js

node test-apis.js
del test-apis.js
echo.

echo [STEP 7] Starting TrendyX AI Server...
echo.
echo ================================================
echo    Server will start in 5 seconds...
echo    Press Ctrl+C to cancel
echo ================================================
timeout /t 5

:: Clear screen and start server
cls
echo ================================================
echo    TRENDYX AI ENTERPRISE SERVER
echo ================================================
echo.
echo Starting on http://localhost:3000
echo.

:: Start the server
node server.js