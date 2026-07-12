# Ship demo/live separation + payment stack (read-only Demo training mode)
# PR: https://github.com/kakaireerick-code/NyumbaTrack/pull/49
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/demo-live-separation-5791"
$PrNumber = "49"

git fetch origin main $Branch 2>$null
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b $Branch }

# If your PC branch is AHEAD of GitHub (consolidated stack), skip pull — push wins.
# Only pull when you need to reconcile with remote:
#   git pull --rebase origin $Branch

npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:api-smoke
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run verify:features
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add -A
$st = git status --porcelain
if ($st) {
  git commit -m "Demo/live separation: read-only training, guarded writes, live-only import"
}

git push -u origin $Branch --force-with-lease
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed (403?) — run from your PC with your GitHub credentials:" -ForegroundColor Yellow
  Write-Host "  git push -u origin $Branch --force-with-lease" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "Pushed $Branch" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Mark PR ready:  gh pr ready $PrNumber" -ForegroundColor DarkGray
Write-Host "  2. Ship to prod:   .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor DarkGray
Write-Host "     (or merge PR #$PrNumber in GitHub UI)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Includes: demo/live separation (F30-F31), per-landlord payment numbers, unified rent flow." -ForegroundColor DarkGray
