# Ship PR #49 — demo/live separation + payment stack
# https://github.com/kakaireerick-code/NyumbaTrack/pull/49
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/demo-live-separation-5791"
$PrNumber = "49"

git fetch origin main $Branch 2>$null
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b $Branch }

# If your PC branch is AHEAD of GitHub (e.g. d5d6e4c), do NOT pull — push wins.

Write-Host "Running tests..." -ForegroundColor Cyan
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
  git commit -m "Demo/live separation: read-only training, per-landlord MoMo, unified rent flow"
}

Write-Host "Pushing $Branch..." -ForegroundColor Cyan
git push -u origin $Branch --force-with-lease
if ($LASTEXITCODE -ne 0) {
  Write-Host "force-with-lease failed — trying --force (your PC stack should win)..." -ForegroundColor Yellow
  git push -u origin $Branch --force
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed — run from your PC with GitHub credentials:" -ForegroundColor Red
    Write-Host "  git push -u origin $Branch --force-with-lease" -ForegroundColor Yellow
    exit $LASTEXITCODE
  }
}

Write-Host ""
Write-Host "Pushed $Branch successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps (owner credentials required):" -ForegroundColor Cyan
Write-Host "  gh pr ready $PrNumber" -ForegroundColor White
Write-Host "  .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor White
Write-Host ""
Write-Host "Stack: demo/live F30-F31, per-landlord payment numbers, unified rent flow, dark login." -ForegroundColor DarkGray
Write-Host "Expect: 159 tests, F1-F31, build OK." -ForegroundColor DarkGray
