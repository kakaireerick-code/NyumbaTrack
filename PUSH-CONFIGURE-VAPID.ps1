# Ship Configure Vercel VAPID GitHub Action (zero-touch after merge)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Branch = "cursor/configure-vapid-ci-ae35"
$onMain = git show "origin/main:.github/workflows/configure-vapid.yml" 2>$null
if ($LASTEXITCODE -eq 0 -and $onMain) {
  Write-Host "SKIP — configure-vapid workflow already on main." -ForegroundColor Green
  Write-Host "Trigger: https://github.com/kakaireerick-code/NyumbaTrack/actions/workflows/configure-vapid.yml" -ForegroundColor Cyan
  exit 0
}

git fetch origin main $Branch 2>$null
git checkout $Branch 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b $Branch }

npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git add -A
$st = git status --porcelain
if ($st) { git commit -m "Add Configure Vercel VAPID GitHub Actions workflow" }
git push -u origin $Branch
Write-Host "Open PR and merge — workflow auto-runs on main and sets VAPID on Vercel." -ForegroundColor Green
