# Master verify loop — F1–F17

Run every turn:

```bash
npm run verify:features   # F1–F17 local checks
npm test && npm run build
npm run ops:guardrail     # production (default: nyumbatracker.vercel.app)
```

## Feature checklist

| ID | Feature | CHECK |
|----|---------|-------|
| F1 | Uganda branding | `index.html` + `manifest.json` mention Uganda |
| F2 | Welcome back login | `LoginPage.jsx` has "Welcome back" |
| F3 | Simple sidebar (8) | `navigation.ts` + Sidebar shows 8 primary only |
| F4 | Settings → More tools | `SettingsPage` links to advanced pages |
| F5 | Subscription pending | No instant `status: 'active'` in subscribe flow |
| F6 | Billing UI complete | `YEARLY_BILLING_OFFER` + plan features in `subscriptionPlans.js` |
| F7 | API health | `api/health.ts` exists |
| F8 | API subscription | `api/subscription.ts` + `subscriptionCloud.ts` |
| F9 | Demo / live mode | `appMode.ts` present |
| F10 | File import | `fileImport.ts` + `DataImportPage` |
| F11 | Guided workflows | `GuidedWorkflowOverlay.jsx` |
| F12 | RBAC isolation | `permissions.ts` blocks tenant/caretaker leaks |
| F13 | MoMo ref validation | `momoVerification.ts` |
| F14 | Guardrail script | `scripts/ops-guardrail.mjs` + npm script |
| F15 | Billing admin panel | `BillingAdminPage.jsx` + PATCH `/api/subscription` |
| F16 | Cloud tenant invites | `api/invite.ts` + cross-device join |
| F17 | Web push notifications | `sw.js` + push APIs + bell subscribe |

## F17 — Web push (after VAPID on Vercel)

1. `npm run generate:vapid` on PC → add keys to Vercel Production
2. Redeploy → `npm run check:vapid` → `/api/health` shows `vapid: true`, `push: true`
3. Bell → **Enable phone notifications** → **When app is closed (PWA)**

See `docs/PUSH-NOTIFICATIONS.md`.

## F15 — Billing admin (PC operator)

1. Sign in as `VITE_BILLING_ADMIN_EMAIL`
2. **Settings → More tools → Billing admin**
3. Paste `BILLING_ADMIN_SECRET` → **Load claims**
4. Submit test MoMo on **Plans & Billing** → claim appears as `pending_verification`
5. **Approve MoMo** → claim status `approved` in Redis

## Loop per feature

```
CHECK → if fail FIX → npm test → git commit → git push → CHECK again
Log: CONFIRMED F# at <commit-sha>
```

## Done when

- All F1–F15 CONFIRMED locally
- `npm run ops:guardrail` → 4/4 PASS on production
- Bundle ≠ `index-B0iUFD94.js`
- `/api/health` returns JSON
