@echo off
setlocal
cd /d "%~dp0"
echo NyumbaTrack Vercel setup helper
echo.
set /p VERCEL_TOKEN=Paste your Vercel token: 
if "%VERCEL_TOKEN%"=="" (
  echo No token entered.
  pause
  exit /b 1
)
node scripts\vercel-setup-helper.mjs
echo.
echo Next: add secrets at https://github.com/kakaireerick-code/NyumbaTrack/settings/secrets/actions
echo See docs\VERCEL-SECRETS-CHECKLIST.md
pause
