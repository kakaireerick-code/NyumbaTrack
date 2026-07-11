# NyumbaTrack owner PC — apply agent patch, push, deploy, guardrail
# Copy with APPLY-ALL.patch to: C:\Users\Erik\Documents\NyumbaTrack\

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoSsh = "git@github.com:kakaireerick-code/NyumbaTrack.git"
$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$GhRepo = "kakaireerick-code/NyumbaTrack"

function Test-NyumbaOrigin {
  $url = (git remote get-url origin 2>$null)
  if (-not $url) { throw "No git remote 'origin'. Run: git remote add origin $RepoHttps" }
  if ($url -match "ultt|land-tax|Land-Tax" -and $url -notmatch "Nyumba|nyumba") {
    Write-Host "Wrong origin (ULTT?): $url" -ForegroundColor Red
    $fix = Read-Host "Fix origin to NyumbaTrack HTTPS? [Y/n]"
    if ($fix -eq "" -or $fix -match "^[Yy]") {
      git remote set-url origin $RepoHttps
      Write-Host "origin -> $RepoHttps" -ForegroundColor Green
    } else {
      throw "Aborting — fix origin manually."
    }
  }
}

Write-Host ""
Write-Host "NyumbaTrack PUSH-NOW" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Test-NyumbaOrigin

Write-Host "1) Git status" -ForegroundColor Yellow
git status -sb
Write-Host "   branch: $(git branch --show-current)" -ForegroundColor DarkGray
Write-Host "   origin: $(git remote get-url origin)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "2) Fetch origin/main" -ForegroundColor Yellow
git fetch origin main
Write-Host ""

$patch = Join-Path $PSScriptRoot "APPLY-ALL.patch"
if (Test-Path $patch) {
  Write-Host "3) Apply APPLY-ALL.patch" -ForegroundColor Yellow
  git apply --check $patch 2>$null
  if ($LASTEXITCODE -eq 0) {
    git apply $patch
    Write-Host "   Patch applied." -ForegroundColor Green
  } else {
    Write-Host "   Patch already applied or not applicable — skipping." -ForegroundColor DarkYellow
  }
} else {
  Write-Host "3) APPLY-ALL.patch not found — skipping apply." -ForegroundColor DarkYellow
}
Write-Host ""

$branch = git branch --show-current
if ($branch -eq "main") {
  $dirty = git status --porcelain
  if ($dirty) {
    Write-Host "4) On main with local changes — creating branch" -ForegroundColor Yellow
    $newBranch = "cursor/billing-admin-pc-5791"
    git checkout -b $newBranch 2>$null
    if ($LASTEXITCODE -ne 0) { git checkout $newBranch }
    $branch = $newBranch
  }
}

$porcelain = git status --porcelain
if ($porcelain) {
  Write-Host "4) Commit local changes" -ForegroundColor Yellow
  git add -A
  git commit -m "Owner PC: apply agent patch (billing admin setup)"
  Write-Host "   Committed." -ForegroundColor Green
} else {
  Write-Host "4) Working tree clean — nothing to commit." -ForegroundColor DarkGray
}
Write-Host ""

Write-Host "5) Push branch" -ForegroundColor Yellow
git push -u origin $branch
Write-Host ""

Write-Host "6) GitHub auth (must be YOU, not Cursor)" -ForegroundColor Yellow
gh auth status
Write-Host ""

$setSecrets = Read-Host "Set Vercel GitHub secrets now? [y/N]"
if ($setSecrets -match "^[Yy]") {
  $token = Read-Host "VERCEL_TOKEN (same token used for vercel:setup)"
  $orgId = Read-Host "VERCEL_ORG_ID (from npm run vercel:setup)"
  $projId = Read-Host "VERCEL_PROJECT_ID (nyumbatrack project)"
  gh secret set VERCEL_TOKEN -R $GhRepo --body $token
  gh secret set VERCEL_ORG_ID -R $GhRepo --body $orgId
  gh secret set VERCEL_PROJECT_ID -R $GhRepo --body $projId
  Write-Host "Secrets set. Names:" -ForegroundColor Green
  gh secret list -R $GhRepo
}
Write-Host ""

Write-Host "7) Trigger Deploy to Vercel workflow" -ForegroundColor Yellow
$deploy = Read-Host "Run deploy.yml on main now? [Y/n]"
if ($deploy -eq "" -or $deploy -match "^[Yy]") {
  gh workflow run deploy.yml -R $GhRepo --ref main
  Write-Host "   Workflow started. Watch:" -ForegroundColor Green
  gh run list -R $GhRepo --workflow=deploy.yml --limit 3
}
Write-Host ""

Write-Host "8) Production guardrail" -ForegroundColor Yellow
$guard = Read-Host "Run npm run ops:guardrail now? [Y/n]"
if ($guard -eq "" -or $guard -match "^[Yy]") {
  npm run ops:guardrail
}

Write-Host ""
Write-Host "Done. Billing env vars: run .\SETUP-BILLING-ADMIN.ps1 if not yet set on Vercel." -ForegroundColor Cyan
Write-Host "Docs: docs\VERCEL-SECRETS-CHECKLIST.md" -ForegroundColor DarkGray
