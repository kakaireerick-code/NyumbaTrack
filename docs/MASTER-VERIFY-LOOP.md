# Master verify loop — F1–F31

Run every turn:

```bash
npm run verify:features   # F1–F31 local checks
npm test
npm run test:api-smoke
npm run build
npm run ops:guardrail     # production (default: nyumbatracker.vercel.app)
```

## Feature checklist (summary)

| Range | Theme |
|-------|--------|
| F1–F14 | Uganda branding, login, sidebar, billing, API, demo mode, import, RBAC, guardrail |
| F15–F18 | Billing admin, cloud invites, push, VAPID |
| F20–F25 | Uptime probes, About/Referrals, boot splash, stable invites, partner rewards, quick add |
| F26 | Tenant messaging + layout + **per-landlord payment numbers** |
| F27 | Tenant behavioral dashboard |
| F28–F29 | Smart spreadsheet + bulk agreement import |
| F30 | Demo write guards (read-only training) |
| F31 | Demo/live separation (import, limits, messages, purge, dark login) |

Full automated checks: `scripts/verify-features.mjs`  
Landlord import fallback: **Data Import** banner (`Can't import your file?`) — manual entry paths.

## Post-PR #49 (on `main`)

Master prompt: **`docs/MASTER-PROMPT-PR49.md`**  
PR #49 merged — work on `main`, push after every session.

## Loop per feature

```
CHECK → if fail FIX → npm test → git commit → git push → CHECK again
Log: CONFIRMED F# at <commit-sha>
```

## Done when

- All F1–F31 CONFIRMED locally
- **159/159** tests pass
- `npm run ops:guardrail` → PASS on production
- Bundle ≠ stale `index-B0iUFD94.js`
- `/api/health` returns JSON
- Changes **pushed** to `origin/main` (or feature branch PR merged)

## Ship (feature PR)

```bash
git push -u origin cursor/<feature>-ae35 --force-with-lease
gh pr create / gh pr merge
# or owner PC:
.\SHIP-TO-PRODUCTION.ps1 -Branch cursor/<feature>-ae35
```
