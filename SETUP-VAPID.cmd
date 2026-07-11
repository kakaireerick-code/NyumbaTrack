@echo off
setlocal
cd /d "%~dp0"
echo NyumbaTrack VAPID setup
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP-VAPID.ps1"
set ERR=%ERRORLEVEL%
echo.
if %ERR% neq 0 (
  echo SETUP-VAPID finished with warnings — see messages above.
) else (
  echo SETUP-VAPID complete.
)
pause
exit /b %ERR%
