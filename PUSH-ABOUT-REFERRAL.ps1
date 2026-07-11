# Ship About page + Partner Rewards referral program
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/about-referral-ae35"

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
if ($st) { git commit -m "About page + Partner Rewards + ULTT-inspired boot loading screen" }
git push -u origin $Branch
Write-Host "Open PR and merge to main — then run Deploy to Vercel." -ForegroundColor Green
