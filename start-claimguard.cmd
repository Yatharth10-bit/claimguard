@echo off
cd /d "%~dp0"
echo Preparing ClaimGuard...
call npm.cmd run build
if errorlevel 1 goto failed

echo.
echo Starting ClaimGuard at http://localhost:3000
echo Keep this window open while using the app.
call npm.cmd run start -- -H 0.0.0.0 -p 3000

:failed
echo.
echo ClaimGuard stopped or failed to start.
pause
