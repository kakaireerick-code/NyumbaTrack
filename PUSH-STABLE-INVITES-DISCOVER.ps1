# Ship stable tenant invites + product discoverability (PR #48)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/stable-invites-discover-ae35"

git fetch origin main $Branch 2>$null
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b $Branch }

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
if ($st) { git commit -m "Stable invites + surface product highlights (Partner Rewards copy fix)" }
git push -u origin $Branch
Write-Host "Pushed $Branch" -ForegroundColor Green

$pr = gh pr list --head $Branch --base main --state open --json number -q ".[0].number" 2>$null
if ($pr) {
  Write-Host "Open PR #$pr — ship to production:" -ForegroundColor Cyan
  Write-Host "  .\SHIP-TO-PRODUCTION.ps1 -PrNumber $pr" -ForegroundColor White
  Write-Host "Or merge on GitHub — push to main auto-deploys via Actions (deploy.yml)." -ForegroundColor DarkGray
} else {
  Write-Host "Create PR on GitHub, then: .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor Yellow
}
