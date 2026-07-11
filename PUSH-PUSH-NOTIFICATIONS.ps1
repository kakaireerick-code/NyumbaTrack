# NyumbaTrack PUSH-PUSH-NOTIFICATIONS.ps1
# Web Push + PWA notifications — branch cursor/push-notifications-5791

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$Branch = "cursor/push-notifications-5791"
$CommitMsg = "Add Web Push notifications with automatic rent and ops alerts"
$GhRepo = "kakaireerick-code/NyumbaTrack"
$PrUrl = "https://github.com/kakaireerick-code/NyumbaTrack/compare/main...$Branch"

Write-Host ""
Write-Host "PUSH-PUSH-NOTIFICATIONS" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

git fetch origin main 2>$null
$onMain = git show "origin/main:public/sw.js" 2>$null
if ($LASTEXITCODE -eq 0 -and $onMain) {
  Write-Host "SKIP — Web push already on main (public/sw.js)." -ForegroundColor Green
  Write-Host "Next: npm run generate:vapid → add VAPID_* to Vercel → redeploy → npm run check:vapid" -ForegroundColor Yellow
  if (Test-Path ".\OWNER-SYNC.ps1") { & ".\OWNER-SYNC.ps1" }
  exit 0
}

$url = git remote get-url origin 2>$null
if ($url -match "ultt|land-tax" -and $url -notmatch "Nyumba|nyumba") {
  git remote set-url origin $RepoHttps
}

Write-Host "Checkout branch $Branch ..." -ForegroundColor Yellow
git fetch origin $Branch 2>$null
if ($LASTEXITCODE -eq 0) {
  git checkout $Branch
  git pull origin $Branch
} else {
  git checkout -b $Branch
}

Write-Host "Install + test ..." -ForegroundColor Yellow
npm install
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run verify:features
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Commit + push ..." -ForegroundColor Yellow
git add -A
$status = git status --porcelain
if ($status) {
  git commit -m $CommitMsg
}
git push -u origin $Branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed (403?). Open PR manually: $PrUrl" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "DONE — open PR: $PrUrl" -ForegroundColor Green
Write-Host "After merge:" -ForegroundColor Yellow
Write-Host "  npm run generate:vapid"
Write-Host "  Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT to Vercel Production"
Write-Host "  Redeploy → npm run check:vapid → .\OWNER-SYNC.ps1"
Write-Host "See docs/PUSH-NOTIFICATIONS.md"
Write-Host ""
