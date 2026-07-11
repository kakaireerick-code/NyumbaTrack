# NyumbaTrack SETUP-VAPID.ps1 — one-time Web Push keys on Vercel
# Run on your PC after push notifications are merged to main.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ProdUrl = "https://nyumbatracker.vercel.app"

Write-Host ""
Write-Host "SETUP-VAPID" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan
Write-Host "Production: $ProdUrl" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path package.json)) {
  Write-Host "Run from NyumbaTrack repo root." -ForegroundColor Red
  exit 1
}

Write-Host "1) Current production push status" -ForegroundColor Yellow
$health = $null
try {
  $health = Invoke-RestMethod -Uri "$ProdUrl/api/health" -TimeoutSec 15
  Write-Host "   health: ok=$($health.ok) push=$($health.push) vapid=$($health.vapid)" -ForegroundColor $(if ($health.vapid) { "Green" } else { "DarkYellow" })
} catch {
  Write-Host "   Could not reach /api/health — check network." -ForegroundColor Red
}
Write-Host ""

if ($health -and $health.vapid -eq $true) {
  Write-Host "VAPID already configured on production." -ForegroundColor Green
  npm run check:vapid
  exit $LASTEXITCODE
}

Write-Host "2) VAPID subject (mailto: for Web Push)" -ForegroundColor Yellow
$defaultSubject = $env:VAPID_SUBJECT
if ([string]::IsNullOrWhiteSpace($defaultSubject)) {
  $defaultSubject = "mailto:admin@nyumbatracker.app"
}
$subject = Read-Host "VAPID_SUBJECT [$defaultSubject]"
if ([string]::IsNullOrWhiteSpace($subject)) { $subject = $defaultSubject }
$env:VAPID_SUBJECT = $subject
Write-Host ""

$hasToken = -not [string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)

if ($hasToken) {
  Write-Host "3) VERCEL_TOKEN detected — upload keys + redeploy via npm run setup:vapid" -ForegroundColor Yellow
  npm run setup:vapid
  $code = $LASTEXITCODE
} else {
  Write-Host "3) Generate keys (paste into Vercel manually)" -ForegroundColor Yellow
  Write-Host "   Vercel → nyumbatrack → Settings → Environment Variables → Production" -ForegroundColor DarkGray
  Write-Host ""
  npm run generate:vapid
  Write-Host ""
  Write-Host "Add the three VAPID_* lines above in Vercel, then Redeploy production." -ForegroundColor Cyan
  $wait = Read-Host "Press Enter after redeploy (or type skip)"
  if ($wait -ne "skip") {
    Write-Host "Waiting 60s for deploy..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 60
  }
  npm run check:vapid
  $code = $LASTEXITCODE
}

Write-Host ""
if ($code -eq 0) {
  Write-Host "VAPID OK — closed-app push is live." -ForegroundColor Green
  Write-Host "Each phone: Add to Home Screen → bell → Enable phone notifications" -ForegroundColor Cyan
} else {
  Write-Host "VAPID not ready yet." -ForegroundColor Yellow
  Write-Host "  - Confirm all three env vars on Vercel Production" -ForegroundColor DarkGray
  Write-Host "  - Redeploy, wait 2 min, run: npm run check:vapid" -ForegroundColor DarkGray
  Write-Host "  - Or set VERCEL_TOKEN and re-run .\SETUP-VAPID.ps1" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Docs: docs\PUSH-NOTIFICATIONS.md" -ForegroundColor DarkGray
exit $code
