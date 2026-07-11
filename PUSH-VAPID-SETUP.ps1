# NyumbaTrack PUSH-VAPID-SETUP.ps1 — ship VAPID owner tooling to main
# Branch: cursor/vapid-setup-tooling-ae35

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$Branch = "cursor/vapid-setup-tooling-ae35"
$CommitMsg = "Add VAPID setup tooling and cross-browser push support"
$PrUrl = "https://github.com/kakaireerick-code/NyumbaTrack/compare/main...$Branch"

Write-Host ""
Write-Host "PUSH-VAPID-SETUP" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""

git fetch origin main 2>$null
$onMain = git show "origin/main:SETUP-VAPID.ps1" 2>$null
if ($LASTEXITCODE -eq 0 -and $onMain) {
  Write-Host "SKIP — SETUP-VAPID.ps1 already on main." -ForegroundColor Green
  Write-Host "Run: .\SETUP-VAPID.ps1" -ForegroundColor Yellow
  exit 0
}

$url = git remote get-url origin 2>$null
if ($url -match "ultt|land-tax" -and $url -notmatch "Nyumba|nyumba") {
  git remote set-url origin $RepoHttps
}

git fetch origin $Branch 2>$null
if ($LASTEXITCODE -eq 0) {
  git checkout $Branch
  git pull origin $Branch
} else {
  git checkout -b $Branch
}

npm install
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run verify:features
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add -A
$status = git status --porcelain
if ($status) { git commit -m $CommitMsg }
git push -u origin $Branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed (403?). Open PR: $PrUrl" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "DONE — merge PR then run:" -ForegroundColor Green
Write-Host "  git pull origin main"
Write-Host "  .\SETUP-VAPID.ps1"
Write-Host ""
