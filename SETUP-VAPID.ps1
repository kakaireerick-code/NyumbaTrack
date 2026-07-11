# NyumbaTrack SETUP-VAPID.ps1 — one-time Web Push keys on Vercel
# Run on your PC: .\SETUP-VAPID.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ProdUrl = "https://nyumbatracker.vercel.app"
$VercelEnvUrl = "https://vercel.com/dashboard"
$KeysFile = Join-Path $PSScriptRoot "vapid-keys.local"

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
  $color = if ($health.vapid) { "Green" } elseif ($health.push) { "DarkYellow" } else { "Red" }
  Write-Host "   ok=$($health.ok) push=$($health.push) vapid=$($health.vapid)" -ForegroundColor $color
  if ($health.push -and -not $health.vapid) {
    Write-Host "   Expected: Redis OK, VAPID keys not on Vercel yet." -ForegroundColor DarkGray
  }
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

if ([string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)) {
  Write-Host "3) Vercel token (optional — auto-upload + redeploy)" -ForegroundColor Yellow
  Write-Host "   Get one: https://vercel.com/account/tokens" -ForegroundColor DarkGray
  $token = Read-Host "VERCEL_TOKEN (Enter to skip — manual paste)"
  if (-not [string]::IsNullOrWhiteSpace($token)) {
    $env:VERCEL_TOKEN = $token
  }
  Write-Host ""
}

$hasToken = -not [string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)

if ($hasToken) {
  Write-Host "4) Upload keys + redeploy (npm run setup:vapid)" -ForegroundColor Yellow
  npm run setup:vapid
  $code = $LASTEXITCODE
} else {
  Write-Host "4) Generate keys → paste into Vercel manually" -ForegroundColor Yellow
  Write-Host "   Open: $VercelEnvUrl → nyumbatrack → Settings → Environment Variables → Production" -ForegroundColor DarkGray
  Write-Host ""
  npm run generate:vapid
  Write-Host ""

  if (Test-Path $KeysFile) {
    Write-Host "Keys saved to: $KeysFile" -ForegroundColor Green
    $copy = Read-Host "Copy all three lines to clipboard? [Y/n]"
    if ($copy -eq "" -or $copy -match "^[Yy]") {
      try {
        Get-Content $KeysFile -TotalCount 3 | Set-Clipboard
        Write-Host "Copied to clipboard — paste into Vercel Production env." -ForegroundColor Green
      } catch {
        Write-Host "Clipboard unavailable — open $KeysFile and copy manually." -ForegroundColor DarkYellow
      }
    }
  }

  Write-Host ""
  Write-Host "In Vercel: add all three VAPID_* vars → Production only → Save" -ForegroundColor Cyan
  Write-Host "Then: Deployments → latest main → Redeploy (Production)" -ForegroundColor Cyan
  Write-Host ""
  $wait = Read-Host "Press Enter after redeploy started (or type skip)"
  if ($wait -ne "skip") {
    Write-Host "Waiting 90s for deploy..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 90
  }
  npm run check:vapid
  $code = $LASTEXITCODE
}

Write-Host ""
if ($code -eq 0) {
  Write-Host "VAPID OK — closed-app push is live." -ForegroundColor Green
  Write-Host "Phones: Add to Home Screen → bell → Enable phone notifications" -ForegroundColor Cyan
  if (Test-Path $KeysFile) {
    Write-Host "Keep $KeysFile private (backup of your keys)." -ForegroundColor DarkGray
  }
} else {
  Write-Host "VAPID not ready yet — common fixes:" -ForegroundColor Yellow
  Write-Host "  1. All three vars on Vercel Production (not Preview only)" -ForegroundColor DarkGray
  Write-Host "  2. Redeploy finished — wait 2 min, run: npm run check:vapid" -ForegroundColor DarkGray
  Write-Host "  3. Or set VERCEL_TOKEN and re-run .\SETUP-VAPID.ps1" -ForegroundColor DarkGray
  if (Test-Path $KeysFile) {
    Write-Host "  Keys file: $KeysFile" -ForegroundColor DarkGray
  }
}

Write-Host ""
Write-Host "Then: .\OWNER-SYNC.ps1 (should stop VAPID warning)" -ForegroundColor Cyan
Write-Host "Docs: docs\PUSH-NOTIFICATIONS.md" -ForegroundColor DarkGray
exit $code
