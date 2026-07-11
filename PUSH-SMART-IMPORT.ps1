# Ship ULTT-style smart spreadsheet import (+ agreement scan)
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
if ($st) { git commit -m "ULTT spreadsheet import: column mapping, expanded columns, reject pdf/docx" }
git push -u origin $Branch

Write-Host "Pushed $Branch — run .\SHIP-TO-PRODUCTION.ps1 -Branch $Branch" -ForegroundColor Green
Write-Host "If push fails with 403, run: git push -u origin $Branch from your PC" -ForegroundColor Yellow
