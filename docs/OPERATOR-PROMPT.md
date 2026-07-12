# NyumbaTrack operator prompt (copy into every cloud agent session)

You are the **NyumbaTrack** agent on `kakaireerick-code/NyumbaTrack`. Do **not** modify Land-Tax-Tracker / ULTT.

## Session start

1. Read `docs/AGENT-HANDOFF.md`, `docs/MASTER-PROMPT-PR49.md`, `docs/MASTER-VERIFY-LOOP.md`, and `docs/UI-PREFERENCE.md`.
2. `git fetch origin && git checkout main && git pull origin main` (default). Use `cursor/*` branches only for explicit feature PRs.
3. `npm install && npm test && npm run verify:features && npm run build`
4. Before closing: commit, **push**, then `npm run ops:guardrail` (default: https://nyumbatracker.vercel.app).

## Production truth checks

Run `npm run ops:guardrail`. **FAIL** if any of:

| Check | Bad (stale Vercel) | Good (this repo deployed) |
|-------|-------------------|---------------------------|
| JS bundle | `index-B0iUFD94.js` | New hash (e.g. `index-CLYx6sdH.js`) |
| Title | Kenyan Landlords | Uganda landlords / NyumbaTrack |
| `/login` | Marketing 404 | Owner RBAC login |
| `/api/health` | HTML (SPA) | JSON `{ ok: true }` |

## Vercel deploy (required for guardrail green)

GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

Vercel Production env:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BILLING_ADMIN_SECRET`
- `VITE_BILLING_ADMIN_EMAIL`

See `docs/DEPLOY.md` and **`docs/VERCEL-SECRETS-CHECKLIST.md`** (issue #24).

## Feature fix playbook

| Feature | Broken when | Fix |
|---------|-------------|-----|
| Subscription bypass | Instant `status: active` on MoMo ref | `submitCloudSubscriptionClaim` → `pending_verification` |
| Billing UI | Stripped plan details | Full `SubscriptionPage` + `subscriptionPlans.js` |
| Demo / import / guided | Missing on stale deploy | `appMode.ts`, `fileImport.ts`, `GuidedWorkflowOverlay` |
| Import file won't work | Landlord blocked on upload | Data Import fallback banner → Buildings/Units/Quick add (see `MASTER-PROMPT-PR49.md`) |
| Uganda branding | Kenya copy on Vercel | `index.html`, `public/manifest.json` |
| `/api/health` | SPA rewrite only | `api/health.ts` + vercel.json API exclusion |

## Branch workflow

```bash
git checkout main
git pull origin main
# make changes
npm test && npm run verify:features && npm run build
git add -A && git commit -m "..."
git push origin main
npm run ops:guardrail
```

For larger features: `git checkout -b cursor/<feature>-ae35`, push, open PR, merge to `main`.

Reply on the handoff issue with PR link, bundle hash, and guardrail output.
