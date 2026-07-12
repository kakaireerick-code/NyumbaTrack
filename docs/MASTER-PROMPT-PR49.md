# Master prompt — PR #49 consolidated stack

Copy this into **every cloud agent session** working on demo/live separation, payments, or ship.

## Mission

Ship **PR #49** (`cursor/demo-live-separation-5791`) to `main` with:

- Demo/live **read-only training** (F30 guards + F31 separation)
- **Per-landlord payment numbers** (`rt_payment_settings_by_owner`)
- **Unified tenant rent flow** (MoMo + I paid on `my-payments`)
- **Dark mode login** (Google `filled_black` on dark)
- **159 tests**, F1–F31, build OK

## Session start

```bash
git fetch origin main cursor/demo-live-separation-5791
git checkout cursor/demo-live-separation-5791
npm install
npm test && npm run test:api-smoke && npm run verify:features && npm run build
```

Read: `docs/MASTER-VERIFY-LOOP.md`, `docs/AGENT-HANDOFF.md`, `docs/UI-PREFERENCE.md`

**Do not touch:** Land-Tax-Tracker / ULTT

## Architecture map

| Concern | Module / file |
|---------|----------------|
| Demo vs live guards | `src/lib/demoLiveSeparation.ts` |
| Owner scope (buildings/units) | `src/lib/scope.ts` |
| Per-landlord MoMo | `src/lib/ownerSettings.ts` → `rt_payment_settings_by_owner` |
| Practice inbox seed/purge | `src/lib/demoPractice.ts` |
| Guarded writes | `App.jsx` → `guardedSet*` + `setOwnerSettings` |
| Tenant pay flow | `TenantPortalPage.jsx` → `my-payments` |
| Dark Google login | `GoogleSignInButton.jsx` + `LoginPage.jsx` |

## Demo mode rules

1. **Overlay only** — `DEMO_BUILDINGS/UNITS/TENANTS` merged in UI when Demo ON.
2. **Writes blocked** — any persisted change touching `demo-*` IDs → toast, no save.
3. **Demo OFF** → `purgeDemoPracticeData(ownerId)` clears practice messages + `Practice:` notifications.
4. **Data Import** → always uses `ownerBuildings/Units/Tenants` (live portfolio).
5. **Demo MoMo** → `DEMO_TRAINING_PAYMENT_NUMBERS` display only; never `setOwnerSettings` while Demo ON.

## Verify loop (every turn)

```bash
npm test                    # expect 159/159
npm run verify:features     # F1–F31
npm run build
```

Log: `CONFIRMED F# at <sha>` when fixing.

## Ship (owner PC — cloud bot often 403)

```powershell
git fetch origin
git checkout cursor/demo-live-separation-5791
# Do NOT pull if already at d5d6e4c or ahead
.\PUSH-DEMO-LIVE-SEPARATION.ps1
gh pr ready 49
.\SHIP-TO-PRODUCTION.ps1 -Branch cursor/demo-live-separation-5791
```

## Handoff to next agent

Reply with:

- Branch + HEAD sha
- Test count (`npm test` summary)
- `verify:features` PASS line
- PR #49 URL + draft/ready state
- Whether push succeeded or needs owner PC

## Common fixes

| Symptom | Fix |
|---------|-----|
| Demo payment pollutes live | Wire `guardedSetPayments` in `sharedProps` |
| Wrong unit limit in Plans | `SubscriptionPage` gets `ownerUnits` not `units` |
| Tenant sees wrong MoMo | `mergeOwnerSettings(settings, tenant.ownerId)` in portal |
| Google button invisible on login | `theme={loginTheme}` + `filled_black` |
| Practice threads after Demo OFF | `purgeDemoPracticeData` on toggle |

## Done when

- [ ] 159 tests pass
- [ ] F1–F31 CONFIRMED
- [ ] Build OK
- [ ] PR #49 merged to `main`
- [ ] `npm run ops:guardrail` green on production
