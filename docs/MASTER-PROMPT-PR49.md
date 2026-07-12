# Master prompt — PR #49 consolidated stack

Copy this into **every cloud agent session** working on demo/live separation, payments, or ship.

## Mission

Maintain and extend **NyumbaTrack** on `main` (PR #49 stack shipped):

- Demo/live **read-only training** (F30 guards + F31 separation)
- **Per-landlord payment numbers** (`rt_payment_settings_by_owner`)
- **Unified tenant rent flow** (MoMo + I paid on `my-payments`)
- **Dark mode login** (Google `filled_black` on dark)
- **159 tests**, F1–F31, build OK

## Session start

```bash
git fetch origin main
git checkout main
git pull origin main
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

## Push after every work session (mandatory)

After **any** code change, the agent must:

```bash
npm test && npm run test:api-smoke && npm run verify:features && npm run build
git add -A && git commit -m "<clear message>"   # if changes exist
git push origin main
# feature branch: git push -u origin cursor/<name>-ae35 --force-with-lease
```

**Never end a session with unpushed commits.** Hand off HEAD sha + push result to the next agent.

## Ship (feature PR on `main`)

```bash
git checkout -b cursor/<feature>-ae35
# ... changes, tests ...
git push -u origin cursor/<feature>-ae35 --force-with-lease
gh pr create --base main
gh pr merge
npm run ops:guardrail
```

Owner PC: `.\SHIP-TO-PRODUCTION.ps1 -Branch cursor/<feature>-ae35`

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
| Import file won&apos;t work | Tell landlord: add buildings/units/tenants manually (Quick add, invite) — see Data Import fallback banner |

## Landlord message — import fallback

If a landlord **cannot import** a spreadsheet, PDF, or Word file, they should **improvise and carry on** with manual entry:

- **Buildings & units** — Buildings and Units menus
- **Tenants** — Quick add on a unit, or tenant invite code
- **Agreements** — attach PDFs later from tenant profile or Documents

This is shown on **Data Import** and in page guidance. Import is optional, not a blocker.

## Done when

- [x] 159 tests pass (`86f5513`)
- [x] F1–F31 CONFIRMED
- [x] Build OK
- [x] PR #49 merged to `main` (`6e96542`)
- [x] `npm run ops:guardrail` green on production (8/8 PASS)
