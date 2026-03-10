@echo off
taskkill /IM cloudflared.exe /F >nul 2>nul
taskkill /IM python.exe /F >nul 2>nul
echo ??????????
pause
