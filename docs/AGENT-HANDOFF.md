# Agent handoff — NyumbaTrack on main (post PR #49)

**Repo:** `kakaireerick-code/NyumbaTrack`  
**Branch:** `main` (default for all new work)  
**HEAD:** `f0e49ae`+ — PR #49 merged at `6e96542`; import fallback banner shipped  
**Do not touch:** Land-Tax-Tracker / ULTT

## Start here

1. Read **`docs/MASTER-PROMPT-PR49.md`** (master prompt + push protocol)
2. Read **`docs/MASTER-VERIFY-LOOP.md`** (F1–F32)
3. Demo/live bell alerts: **`docs/AGENT-HANDOFF-DEMO-NOTIFICATIONS.md`**
4. `git fetch origin && git checkout main && git pull origin main`
4. `npm test && npm run verify:features && npm run build`

## On main today

| Area | Key files |
|------|-----------|
| Demo/live separation | `demoLiveSeparation.ts`, guarded setters in `App.jsx` |
| Per-landlord MoMo | `ownerSettings.ts`, `rt_payment_settings_by_owner` |
| Unified rent flow | `TenantPortalPage.jsx` (`my-payments`) |
| Dark login fix | `GoogleSignInButton.jsx`, `LoginPage.jsx` |
| Smart import + fallback | `DataImportPage.jsx` — banner if import fails → manual entry |
| Operator docs | `docs/MASTER-PROMPT-PR49.md` |

## Import fallback (landlord UX)

If spreadsheet/PDF/Word import fails, landlords **improvise and carry on**:

- Buildings & units → Buildings / Units menus
- Tenants → Quick add on a unit, or invite code
- Agreements → tenant profile or Documents later

Banner on **Data Import**; guidance in `actionGuidance.ts`.

## Push after every work session

```bash
npm test && npm run verify:features && npm run build
git add -A && git commit -m "<message>"   # if changes
git push origin main
```

Feature branches: `git push -u origin cursor/<name>-ae35 --force-with-lease` then PR → merge.

## Owner PC sync

```powershell
git fetch origin
git checkout main
git reset --hard origin/main
```

## Acknowledgment (when shipping a PR)

- HEAD sha
- Test count (159/159)
- `verify:features` PASS (F1–F31)
- `npm run ops:guardrail` output
