# Ship demo/live separation (read-only training mode)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/demo-live-separation-5791"

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
if ($st) { git commit -m "Demo/live separation: read-only training mode, guarded writes, live-only import" }
git push -u origin $Branch

Write-Host "Pushed $Branch — run .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor Green
Write-Host "If push fails with 403, run: git push -u origin $Branch from your PC" -ForegroundColor Yellow
