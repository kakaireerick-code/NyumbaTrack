# Ship Quick add fix + login reset v8
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/quick-add-login-reset-ae35"

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
if ($st) { git commit -m "Fix Quick add submit + login reset v8" }
git push -u origin $Branch

Write-Host "Pushed $Branch — run .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor Green
