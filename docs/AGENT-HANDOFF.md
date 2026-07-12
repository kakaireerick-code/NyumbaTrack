# Agent handoff — PR #49 demo/live + payments

**Repo:** `kakaireerick-code/NyumbaTrack`  
**Branch:** `cursor/demo-live-separation-5791`  
**PR #49** — **MERGED** to `main` at `6e96542` (2026-07-12). Branch `cursor/demo-live-separation-5791` shipped.  
**Do not touch:** Land-Tax-Tracker / ULTT

## Start here

1. Read **`docs/MASTER-PROMPT-PR49.md`** (master prompt for this stack)
2. Read **`docs/MASTER-VERIFY-LOOP.md`** (F1–F31)
3. `git checkout cursor/demo-live-separation-5791`
4. `npm test && npm run verify:features && npm run build`

## This branch includes

| Area | Key files |
|------|-----------|
| Demo/live separation | `demoLiveSeparation.ts`, `demoPractice.ts`, guarded setters in `App.jsx` |
| Per-landlord MoMo | `ownerSettings.ts`, `rt_payment_settings_by_owner` |
| Unified rent flow | `TenantPortalPage.jsx` (`my-payments`), `TenantBottomNav.jsx` |
| Dark login fix | `GoogleSignInButton.jsx`, `LoginPage.jsx` |
| Smart import | `spreadsheetImport.ts`, `agreementScan.ts` (from main ancestry) |
| Ship script | `PUSH-DEMO-LIVE-SEPARATION.ps1` |

## Cloud agent limits

- `git push` may return **403** — owner runs `PUSH-DEMO-LIVE-SEPARATION.ps1` on PC
- `gh pr ready` / merge need owner credentials

## Owner PC ship (final step)

```powershell
git fetch origin
git checkout cursor/demo-live-separation-5791
.\PUSH-DEMO-LIVE-SEPARATION.ps1
gh pr ready 49
.\SHIP-TO-PRODUCTION.ps1 -Branch cursor/demo-live-separation-5791
```

**Do not pull** if local HEAD is already at consolidated stack (`d5d6e4c` or ahead).

## Acknowledgment

Comment on PR #49 with:

- HEAD sha
- Test count (159/159)
- `verify:features` PASS (F1–F31)
- Guardrail output after merge
