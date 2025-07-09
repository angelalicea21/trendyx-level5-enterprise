@echo off
color 0E
cls

echo ═══════════════════════════════════════════════════════════
echo    📍 VERIFYING YOUR TRENDYX INSTALLATION LOCATION 📍
echo ═══════════════════════════════════════════════════════════
echo.

echo Current drive: %CD:~0,2%
echo.

echo Checking H: drive...
H:
cd \TrendyX-Level5-Enterprise 2>nul

if exist server.js (
    color 0A
    echo ✅ FOUND! TrendyX Level 5 is installed at:
    echo    H:\TrendyX-Level5-Enterprise
    echo.
    echo Files found:
    if exist server.js echo    ✓ server.js
    if exist package.json echo    ✓ package.json
    if exist .env echo    ✓ .env (configuration file)
    if exist public\index.html echo    ✓ public\index.html
    echo.
    
    :: Show current API key status
    if exist .env (
        findstr "your_openai_key_here" .env >nul 2>&1
        if %errorlevel% equ 0 (
            color 0E
            echo ⚠️  WARNING: You're using FAKE API keys!
            echo    You need to replace them with real ones.
        ) else (
            echo ✅ API keys appear to be configured
        )
    )
    echo.
    echo 🎯 NEXT STEPS:
    echo    1. Run Quick-Fix-Level5.bat to fix API keys
    echo    2. Or run Start-TrendyX-Level5.bat to start server
    echo.
) else (
    color 0C
    echo ❌ NOT FOUND at H:\TrendyX-Level5-Enterprise
    echo.
    echo Checking other locations...
    
    :: Check C drive just in case
    C:
    if exist C:\TrendyX-Level4-Enterprise\server.js (
        echo.
        echo Found installation at: C:\TrendyX-Level4-Enterprise
        echo But you said it's on H: drive - please check your path!
    )
    
    if exist C:\TrendyX-Level5-Enterprise\server.js (
        echo.
        echo Found installation at: C:\TrendyX-Level5-Enterprise
        echo But you said it's on H: drive - please check your path!
    )
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause