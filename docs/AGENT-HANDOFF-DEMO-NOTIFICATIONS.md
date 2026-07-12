# Agent handoff — Demo notifications must not leak into live mode

**Repo:** `kakaireerick-code/NyumbaTrack`  
**Branch shipped:** `cursor/demo-live-notifications-ae35`  
**Related:** F30/F31 demo/live separation

## Problem

With **Demo OFF**, landlords could still see bell alerts that came from demo training:

- `Practice:` notifications left in storage
- Phantom **Unread messages** from demo inbox threads
- Portfolio nudges (vacant units, overdue rent, maintenance) computed from **demo-merged** buildings/units
- **Demo mode is on** auto-alert after toggling Demo OFF

## Fix summary

| Piece | File | Behavior |
|-------|------|----------|
| `reconcileLiveNotifications()` | `src/lib/demoPractice.ts` | Strips phantom owner alerts when live portfolio does not justify them |
| `purgeDemoPracticeData()` | `src/lib/demoPractice.ts` | Calls reconcile when passed live-scoped context |
| Live login / Demo OFF | `src/App.jsx` | Purge + reconcile on session start when Demo is off |
| Auto-notification engine | `src/App.jsx` + `autoNotifications.ts` | Uses **live** `ownerBuildings/Units/Tenants` only; skips unread auto-alerts when Demo ON |

## Rule for future agents

**Never pass demo-merged portfolio lists into `runAutoNotifications` for property owners.**

Use live-scoped lists only:

```javascript
buildings: ownerBuildings   // NOT effectiveBuildings / portalBuildings
units: ownerUnits
tenants: ownerTenants
maintenance: ownerMaintenance
unreadMessages: countUnreadForOwner(ownerId, { excludeDemo: true })
```

When Demo is ON, pass `unreadMessages: 0` for owners so the auto-engine does not fire phantom unread alerts. Practice items still appear via `ensureDemoPracticeData` seeding.

## Verify

```bash
npm test
npm run verify:features
npm run build
```

Key tests: `src/lib/demoPractice.test.ts`, `src/lib/autoNotifications.test.ts`

## PC sync after merge

```powershell
git fetch origin
git checkout main
git reset --hard origin/main
```
