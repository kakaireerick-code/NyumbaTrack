# Ship API error-rate hardening (uptime probes return HTTP 200)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/error-rate-hardening-ae35"

git fetch origin main $Branch 2>$null
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b $Branch }

npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run test:api-smoke
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run verify:features
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add -A
$st = git status --porcelain
if ($st) { git commit -m "Harden API routes for Vercel uptime probes (HTTP 200 not 503/405)" }
git push -u origin $Branch
Write-Host "Open PR and merge to main — then run Deploy to Vercel." -ForegroundColor Green
Write-Host "After deploy: npm run ops:guardrail (expect 8/8 checks)" -ForegroundColor Cyan
