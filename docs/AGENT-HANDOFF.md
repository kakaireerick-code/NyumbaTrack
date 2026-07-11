# Agent handoff — coordination → NyumbaTrack

**Repo:** `kakaireerick-code/NyumbaTrack`  
**Branch:** `cursor/integrate-patch-features-5791`  
**Do not touch:** Land-Tax-Tracker / ULTT

## Start here

1. Read **`docs/OPERATOR-PROMPT.md`**
2. Read GitHub issue **#17** (latest)
3. Merge integrate branch → `main`
4. Fix Vercel deploy → `npm run ops:guardrail` until green

## Integrate branch includes

| Area | Key files |
|------|-----------|
| Subscription verification | `api/subscription.ts`, `src/lib/subscriptionCloud.ts`, `SubscriptionPage.jsx` |
| Full billing UI | `subscriptionPlans.js`, `SubscriptionPage.jsx` |
| Demo vs live | `src/lib/appMode.ts` |
| Import | `src/lib/fileImport.ts`, `DataImportPage.jsx` |
| Guided workflows | `GuidedWorkflowOverlay.jsx` |
| Uganda branding | `index.html`, `public/manifest.json` |
| Health API | `api/health.ts` |
| Production guardrail | `scripts/ops-guardrail.mjs` |

## Stale remote / bundle recovery

If `origin/cursor/integrate-patch-features-5791` is behind:

```bash
git fetch /path/to/nyumbatrack-integrate-614ba58.bundle cursor/integrate-patch-features-5791:cursor/integrate-patch-features-5791
git checkout cursor/integrate-patch-features-5791
```

## Vercel checklist

**GitHub secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`  
**Vercel env:** `UPSTASH_REDIS_*`, `BILLING_ADMIN_SECRET`, `VITE_BILLING_ADMIN_EMAIL`

Full steps: **`docs/VERCEL-SECRETS-CHECKLIST.md`** (issue #24)

## Acknowledgment

Comment on issue #17 with:

- PR link
- Production bundle hash (not `index-B0iUFD94.js`)
- `npm run ops:guardrail` output
