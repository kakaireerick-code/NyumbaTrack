# Upload existing vapid-keys.local to Vercel (no regeneration)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "vapid-keys.local")) {
  Write-Host "Missing vapid-keys.local — run .\SETUP-VAPID.ps1 first or npm run generate:vapid" -ForegroundColor Red
  exit 1
}

if ([string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)) {
  Write-Host "VERCEL_TOKEN required for auto-upload." -ForegroundColor Yellow
  Write-Host "Get one: https://vercel.com/account/tokens" -ForegroundColor DarkGray
  $env:VERCEL_TOKEN = Read-Host "Paste VERCEL_TOKEN"
}

if ([string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)) {
  Write-Host "No token — use manual paste from vapid-keys.local into Vercel Production." -ForegroundColor Red
  exit 1
}

Write-Host "Uploading vapid-keys.local to Vercel Production..." -ForegroundColor Cyan
npm run upload:vapid
exit $LASTEXITCODE
