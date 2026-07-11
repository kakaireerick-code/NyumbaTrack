# NyumbaTrack owner PC — sync main, then optional patch push / deploy
# Prefer OWNER-SYNC.ps1 for daily use. This script runs sync first.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$GhRepo = "kakaireerick-code/NyumbaTrack"

$ownerSync = Join-Path $PSScriptRoot "OWNER-SYNC.ps1"
if (Test-Path $ownerSync) {
  Write-Host "Running OWNER-SYNC first..." -ForegroundColor Cyan
  & $ownerSync
  if ($LASTEXITCODE -ne 0) {
    Write-Host "OWNER-SYNC failed — fix before pushing." -ForegroundColor Red
    exit $LASTEXITCODE
  }
  Write-Host ""
}

$continue = Read-Host "Continue with legacy patch push? [y/N]"
if ($continue -notmatch "^[Yy]") {
  Write-Host "Done (sync only)." -ForegroundColor Green
  exit 0
}

function Test-NyumbaOrigin {
  $url = (git remote get-url origin 2>$null)
  if (-not $url) { throw "No git remote 'origin'. Run: git remote add origin $RepoHttps" }
  if ($url -match "ultt|land-tax|Land-Tax" -and $url -notmatch "Nyumba|nyumba") {
    Write-Host "Wrong origin (ULTT?): $url" -ForegroundColor Red
    $fix = Read-Host "Fix origin to NyumbaTrack HTTPS? [Y/n]"
    if ($fix -eq "" -or $fix -match "^[Yy]") {
      git remote set-url origin $RepoHttps
      Write-Host "origin -> $RepoHttps" -ForegroundColor Green
    } else {
      throw "Aborting — fix origin manually."
    }
  }
}

Write-Host ""
Write-Host "PUSH-NOW (legacy patch flow)" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

Test-NyumbaOrigin

$patch = Join-Path $PSScriptRoot "APPLY-ALL.patch"
if (Test-Path $patch) {
  Write-Host "Apply APPLY-ALL.patch" -ForegroundColor Yellow
  git apply --check $patch 2>$null
  if ($LASTEXITCODE -eq 0) {
    git apply $patch
    git checkout origin/main -- package.json 2>$null
    Write-Host "Patch applied." -ForegroundColor Green
  } else {
    Write-Host "Patch not applicable — skipping." -ForegroundColor DarkYellow
  }
}

$branch = git branch --show-current
if ($branch -eq "main" -and (git status --porcelain)) {
  $newBranch = "cursor/owner-pc-$(Get-Date -Format 'yyyyMMdd')-5791"
  git checkout -b $newBranch
  $branch = $newBranch
}

if (git status --porcelain) {
  git add -A
  git commit -m "Owner PC: apply agent patch"
  git push -u origin $branch
  Write-Host "Pushed $branch" -ForegroundColor Green
} else {
  Write-Host "Nothing to commit." -ForegroundColor DarkGray
}

Write-Host "Done. See docs\POWERSHELL-OWNER.md" -ForegroundColor Cyan
