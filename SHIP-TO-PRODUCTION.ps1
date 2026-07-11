# Merge agent PR → auto-deploy main via GitHub Actions → verify production
# Usage:
#   .\SHIP-TO-PRODUCTION.ps1 -Branch cursor/stable-invites-discover-ae35
#   .\SHIP-TO-PRODUCTION.ps1 -PrNumber 48
param(
  [string]$Branch = "",
  [string]$PrNumber = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ProdUrl = "https://nyumbatracker.vercel.app"

if (-not $PrNumber -and $Branch) {
  $PrNumber = gh pr list --head $Branch --base main --state open --json number -q ".[0].number" 2>$null
}

if ($PrNumber) {
  Write-Host "Merging PR #$PrNumber..." -ForegroundColor Cyan
  gh pr merge $PrNumber --merge --delete-branch=false
  Write-Host "Merged. Deploy to Vercel starts automatically on push to main." -ForegroundColor Green
} else {
  Write-Host "No open PR — assuming main already has latest. Checking deploy..." -ForegroundColor Yellow
}

Write-Host "Waiting for GitHub Actions deploy (up to 10 min)..." -ForegroundColor Cyan
$deadline = (Get-Date).AddMinutes(10)
do {
  $run = gh run list --workflow=deploy.yml --branch=main --limit=1 --json status,conclusion,url | ConvertFrom-Json
  if ($run.status -eq "completed") {
    if ($run.conclusion -ne "success") {
      Write-Host "Deploy failed: $($run.conclusion) — $($run.url)" -ForegroundColor Red
      exit 1
    }
    Write-Host "Deploy succeeded." -ForegroundColor Green
    break
  }
  if ((Get-Date) -gt $deadline) {
    Write-Host "Timed out waiting for deploy." -ForegroundColor Red
    exit 1
  }
  Start-Sleep -Seconds 15
} while ($true)

$env:GUARDRAIL_URL = $ProdUrl
npm run ops:guardrail
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "LIVE: $ProdUrl" -ForegroundColor Green
Write-Host "Future agent updates: push cursor/*-ae35 branch → CI passes → auto-ship workflow can merge, or run this script." -ForegroundColor DarkGray
