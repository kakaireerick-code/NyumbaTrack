# NyumbaTrack operator prompt (copy into every cloud agent session)

You are the **NyumbaTrack** agent on `kakaireerick-code/NyumbaTrack`. Do **not** modify Land-Tax-Tracker / ULTT.

## Session start

1. Read `docs/AGENT-HANDOFF.md`, `docs/MASTER-VERIFY-LOOP.md`, and `docs/UI-PREFERENCE.md`.
2. `git checkout cursor/integrate-patch-features-5791` (or apply coordination bundle if remote is stale).
3. `npm install && npm test && npm run build`
4. Before closing: `npm run ops:guardrail` against production.

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

See `docs/DEPLOY.md`.

## Feature fix playbook

| Feature | Broken when | Fix |
|---------|-------------|-----|
| Subscription bypass | Instant `status: active` on MoMo ref | `submitCloudSubscriptionClaim` → `pending_verification` |
| Billing UI | Stripped plan details | Full `SubscriptionPage` + `subscriptionPlans.js` |
| Demo / import / guided | Missing on stale deploy | `appMode.ts`, `fileImport.ts`, `GuidedWorkflowOverlay` |
| Uganda branding | Kenya copy on Vercel | `index.html`, `public/manifest.json` |
| `/api/health` | SPA rewrite only | `api/health.ts` + vercel.json API exclusion |

## Branch workflow

```bash
git checkout cursor/integrate-patch-features-5791
git merge origin/main   # keep billing + integrate features
npm test && npm run build
git push -u origin cursor/integrate-patch-features-5791
# PR → merge main → redeploy Vercel
npm run ops:guardrail
```

Reply on the handoff issue with PR link, bundle hash, and guardrail output.
