# Apply Partner Rewards automation (15% credits, tracker, sidebar quick links)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/partner-rewards-auto-ae35"

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
if ($st) { git commit -m "Partner Rewards automation: 15% credits, tracker, sidebar quick links" }
git push -u origin $Branch

$pr = gh pr list --head $Branch --base main --state open --json number -q ".[0].number" 2>$null
if (-not $pr) {
  gh pr create --base main --head $Branch --title "Partner Rewards automation" --body "15% billing credit per referral (max 45%), step tracker, auto credit notes, sidebar quick links for Plans/Rewards/Messages/Help."
}

Write-Host "Pushed $Branch — run .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch to merge and deploy." -ForegroundColor Green
