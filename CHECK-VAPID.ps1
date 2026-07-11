# Quick VAPID production check (no key generation)
param([switch]$Wait)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if ($Wait) {
  $env:WAIT_SECS = "120"
  Write-Host "Polling up to 120s for deploy..." -ForegroundColor DarkGray
}
Write-Host "Checking VAPID on https://nyumbatracker.vercel.app ..." -ForegroundColor Cyan
npm run check:vapid
exit $LASTEXITCODE
