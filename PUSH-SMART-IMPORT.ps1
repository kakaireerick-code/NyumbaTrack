# Ship smart spreadsheet + bulk agreement import
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/smart-import-ae35"

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
if ($st) { git commit -m "Smart import: xlsx spreadsheet + bulk PDF/Word agreement scan" }
git push -u origin $Branch

Write-Host "Pushed $Branch — run .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor Green
