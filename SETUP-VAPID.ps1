# NyumbaTrack SETUP-VAPID.ps1 — one-time Web Push keys on Vercel
# Run on your PC: .\SETUP-VAPID.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ProdUrl = "https://nyumbatracker.vercel.app"
$VercelEnvUrl = "https://vercel.com/dashboard"
$KeysFile = Join-Path $PSScriptRoot "vapid-keys.local"

function Show-VapidEnvGap($health) {
  if (-not $health.vapidEnv) { return }
  $labels = @{
    publicKey = "VAPID_PUBLIC_KEY"
    privateKey = "VAPID_PRIVATE_KEY"
    subject = "VAPID_SUBJECT"
  }
  $missing = @()
  foreach ($prop in $health.vapidEnv.PSObject.Properties) {
    if (-not $prop.Value) { $missing += $labels[$prop.Name] }
  }
  if ($missing.Count -gt 0) {
    Write-Host "   Missing on Production deployment: $($missing -join ', ')" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "SETUP-VAPID" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan
Write-Host "Production: $ProdUrl" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path package.json)) {
  Write-Host "Run from NyumbaTrack repo root." -ForegroundColor Red
  exit 1
}

Write-Host "1) Production status (/api/health)" -ForegroundColor Yellow
$health = $null
try {
  $health = Invoke-RestMethod -Uri "$ProdUrl/api/health" -TimeoutSec 15
  $color = if ($health.vapid) { "Green" } elseif ($health.push) { "DarkYellow" } else { "Red" }
  Write-Host "   ok=$($health.ok) push=$($health.push) vapid=$($health.vapid)" -ForegroundColor $color
  Show-VapidEnvGap $health
  if ($health.push -and -not $health.vapid) {
    Write-Host "   Keys exist locally but not on Vercel Production yet." -ForegroundColor DarkGray
  }
} catch {
  Write-Host "   Could not reach /api/health" -ForegroundColor Red
}
Write-Host ""

if ($health -and $health.vapid -eq $true) {
  Write-Host "VAPID already live." -ForegroundColor Green
  npm run check:vapid
  exit $LASTEXITCODE
}

$hasKeysFile = Test-Path $KeysFile

if ($hasKeysFile) {
  Write-Host "2) Found existing keys: $KeysFile" -ForegroundColor Green
  Write-Host "   Will NOT regenerate unless you choose [G] below." -ForegroundColor DarkGray
} else {
  Write-Host "2) No vapid-keys.local yet — will generate new keys" -ForegroundColor Yellow
}
Write-Host ""

if ([string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)) {
  Write-Host "3) Vercel token (auto-upload + redeploy)" -ForegroundColor Yellow
  Write-Host "   https://vercel.com/account/tokens" -ForegroundColor DarkGray
  $token = Read-Host "VERCEL_TOKEN (Enter to skip manual paste)"
  if (-not [string]::IsNullOrWhiteSpace($token)) { $env:VERCEL_TOKEN = $token }
  Write-Host ""
}

$hasToken = -not [string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)
$code = 1

if ($hasToken -and $hasKeysFile) {
  Write-Host "4) Upload existing keys (npm run upload:vapid)" -ForegroundColor Yellow
  $go = Read-Host "Upload vapid-keys.local to Vercel? [Y/n]"
  if ($go -eq "" -or $go -match "^[Yy]") {
    npm run upload:vapid
    $code = $LASTEXITCODE
  } else {
    $hasToken = $false
  }
}

if ($code -ne 0 -and $hasToken -and -not $hasKeysFile) {
  Write-Host "4) Generate + upload (npm run setup:vapid)" -ForegroundColor Yellow
  if ([string]::IsNullOrWhiteSpace($env:VAPID_SUBJECT)) {
    $env:VAPID_SUBJECT = "mailto:admin@nyumbatracker.app"
  }
  npm run setup:vapid
  $code = $LASTEXITCODE
}

if ($code -ne 0 -and -not $hasToken) {
  if (-not $hasKeysFile) {
    Write-Host "4) Generate keys" -ForegroundColor Yellow
    $env:VAPID_SUBJECT = if ($env:VAPID_SUBJECT) { $env:VAPID_SUBJECT } else { "mailto:admin@nyumbatracker.app" }
    npm run generate:vapid
    Write-Host ""
  }

  Write-Host "5) MANUAL STEP REQUIRED (script cannot paste to Vercel)" -ForegroundColor Cyan
  Write-Host "   a) Open $KeysFile" -ForegroundColor White
  Write-Host "   b) Vercel -> nyumbatrack -> Settings -> Environment Variables -> Production" -ForegroundColor White
  Write-Host "   c) Add all THREE: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT" -ForegroundColor White
  Write-Host "   d) Deployments -> latest main -> Redeploy -> Production" -ForegroundColor White
  Write-Host ""

  if (Test-Path $KeysFile) {
    $copy = Read-Host "Copy three lines to clipboard? [Y/n]"
    if ($copy -eq "" -or $copy -match "^[Yy]") {
      try {
        Get-Content $KeysFile -TotalCount 3 | Set-Clipboard
        Write-Host "Copied — paste into Vercel now." -ForegroundColor Green
      } catch {
        Write-Host "Open $KeysFile manually." -ForegroundColor DarkYellow
      }
    }
  }

  if ($hasToken) {
    Write-Host ""
    $upload = Read-Host "Paste done + redeploy started? Upload via token instead? [y/N]"
    if ($upload -match "^[Yy]") {
      npm run upload:vapid
      $code = $LASTEXITCODE
    }
  }

  if ($code -ne 0) {
    Write-Host ""
    $ready = Read-Host "Type YES after all three vars are in Vercel Production AND redeploy started"
    if ($ready -ne "YES") {
      Write-Host "Stopped — complete Vercel paste + redeploy, then run .\CHECK-VAPID.ps1 -Wait" -ForegroundColor Yellow
      exit 1
    }
    Write-Host "Waiting 90s..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 90
    npm run check:vapid
    $code = $LASTEXITCODE
  }
}

Write-Host ""
if ($code -eq 0) {
  Write-Host "VAPID OK — closed-app push is live." -ForegroundColor Green
  Write-Host "Phones: Add to Home Screen -> bell -> Enable phone notifications" -ForegroundColor Cyan
} else {
  Write-Host "VAPID not live yet." -ForegroundColor Yellow
  Write-Host "  Quick fix: open vapid-keys.local -> paste 3 vars -> Vercel Production -> Redeploy" -ForegroundColor White
  Write-Host "  Or: `$env:VERCEL_TOKEN='...'; npm run upload:vapid" -ForegroundColor White
  Write-Host "  Then: .\CHECK-VAPID.ps1 -Wait" -ForegroundColor White
}

Write-Host ""
Write-Host "Then: .\OWNER-SYNC.ps1" -ForegroundColor Cyan
exit $code
