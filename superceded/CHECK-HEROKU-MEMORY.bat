@echo off
echo ====================================
echo Checking TrendyX Heroku Memory Usage
echo ====================================
echo.

echo Current Heroku Dyno Info:
heroku ps
echo.

echo Memory Usage Details:
heroku run "node -e \"console.log('Heap Limit:', require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024, 'MB')\""
echo.

echo Checking Application Health:
curl https://trendyx-level5-6b5070635ee0.herokuapp.com/api/health
echo.
echo.

echo Recent Logs (Memory Related):
heroku logs --tail -n 50 | findstr /I "memory R14 R15"
echo.

echo ====================================
echo Memory Optimization Tips:
echo ====================================
echo 1. Current config uses minimal quantum (8 qubits) and neural (256 connections)
echo 2. To use full power, upgrade to: heroku ps:resize web=standard-2x
echo 3. For testing, you can disable features in memory-optimizer.js
echo.
pause