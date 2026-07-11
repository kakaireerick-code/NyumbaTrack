# Archived push guides (superseded)

These workflows are **obsolete** after PRs #31–#32 merged to `main`.

## Use instead

- **Daily:** `OWNER-SYNC.ps1` (see `docs/POWERSHELL-OWNER.md`)
- **Billing admin:** https://nyumbatracker.vercel.app/billing-admin
- **Secrets:** `SETUP-BILLING-ADMIN.ps1` + `docs/VERCEL-SECRETS-CHECKLIST.md`

---

## Former scripts (do not run)

| Script | Was for | Now |
|--------|---------|-----|
| `AUTO-PUSH-BILLING.ps1` | Ship billing admin panel | On main — script SKIPs |
| `PUSH-DEEPLINK.ps1` | Ship `/billing-admin` URL | On main — script SKIPs |
| `MERGE-NOW.ps1` | Force merge helper | Deleted / obsolete |
| `RUN-BILLING-NOW.ps1` | Old billing push | Deleted / obsolete |
| `PUSH-NOW.ps1` + `APPLY-ALL.patch` | Large integrate patch | Already merged |

---

## Historical: BILLING-ADMIN-PUSH.md

Owner PC steps for PR #31 (billing admin panel):

1. Copy `AUTO-PUSH-BILLING.ps1` → run → merge PR
2. Set Vercel env vars
3. `npm run ops:guardrail`

**Status:** Complete. Panel live on production.

---

## Historical: deeplink push

Owner PC steps for PR #32 (`/billing-admin`):

1. Copy `PUSH-DEEPLINK.ps1` → run → merge PR
2. Test https://nyumbatracker.vercel.app/billing-admin

**Status:** Complete. Deep link live.

---

## Production domains

| URL | Status |
|-----|--------|
| https://nyumbatracker.vercel.app | **Live** — Uganda app, APIs, billing admin |
| https://nyumbatrack.vercel.app | **Stale** — old Kenyan marketing build |

Guardrail default targets **nyumbatracker.vercel.app** as of PS cleanup PR.
