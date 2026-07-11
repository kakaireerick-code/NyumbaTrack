# NyumbaTrack OWNER-SYNC.ps1 — daily owner PC sync + production checks
# Copy to: C:\Users\Erik\Documents\NyumbaTrack\OWNER-SYNC.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$ProdUrl = "https://nyumbatracker.vercel.app"
$BillingAdminUrl = "$ProdUrl/billing-admin"

function Test-NyumbaOrigin {
  $url = git remote get-url origin 2>$null
  if (-not $url) {
    Write-Host "No origin remote — add: git remote add origin $RepoHttps" -ForegroundColor Red
    return $false
  }
  if ($url -match "ultt|land-tax|Land-Tax" -and $url -notmatch "Nyumba|nyumba") {
    Write-Host "Wrong origin (ULTT?): $url" -ForegroundColor Yellow
    git remote set-url origin $RepoHttps
    Write-Host "Fixed origin -> $RepoHttps" -ForegroundColor Green
  }
  return $true
}

Write-Host ""
Write-Host "OWNER-SYNC" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "Production: $ProdUrl" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-NyumbaOrigin)) { exit 1 }

Write-Host "1) Git fetch + pull main" -ForegroundColor Yellow
git fetch origin main
$branch = git branch --show-current
if ($branch -ne "main") {
  git checkout main 2>$null
  if ($LASTEXITCODE -ne 0) { git checkout -B main origin/main }
}
git pull --ff-only origin main
Write-Host "   main @ $(git rev-parse --short HEAD)" -ForegroundColor Green
Write-Host ""

Write-Host "2) GitHub auth (should be YOU)" -ForegroundColor Yellow
gh auth status 2>&1
Write-Host ""

Write-Host "3) npm install (if package.json changed)" -ForegroundColor Yellow
if (Test-Path package.json) {
  npm install --no-audit --no-fund 2>&1 | Select-Object -Last 3
}
Write-Host ""

Write-Host "4) Production guardrail" -ForegroundColor Yellow
$env:GUARDRAIL_URL = $ProdUrl
npm run ops:guardrail
$guardOk = $LASTEXITCODE -eq 0
Write-Host ""

Write-Host "5) Local verify (optional)" -ForegroundColor Yellow
if (Test-Path package.json) {
  npm run verify:features 2>&1 | Select-Object -Last 4
}
Write-Host ""

Write-Host "--- Owner quick links ---" -ForegroundColor Cyan
Write-Host "  Billing admin: $BillingAdminUrl"
Write-Host "  MoMo line:     0793068911"
Write-Host "  Setup secret:  .\SETUP-BILLING-ADMIN.ps1"
Write-Host "  Docs:          docs\POWERSHELL-OWNER.md"
Write-Host ""

if ($guardOk) {
  Write-Host "SYNC OK — production guardrail passed." -ForegroundColor Green
} else {
  Write-Host "SYNC WARN — guardrail failed. Check deploy or GUARDRAIL_URL." -ForegroundColor Yellow
  exit 1
}
