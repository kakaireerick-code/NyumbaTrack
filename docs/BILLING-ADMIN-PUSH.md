# AUTO-PUSH billing admin — owner PC walkthrough

Use when `BillingAdminPage.jsx` is not on `main` yet.

## Files

| File | Size (approx) | Purpose |
|------|---------------|---------|
| `AUTO-PUSH-BILLING.ps1` | 57 KB | Embeds patch + git push |
| `BILLING-ADMIN-ONLY.patch` | 41 KB | Standalone patch (also inside PS1) |

You only need **one** of them — prefer `AUTO-PUSH-BILLING.ps1`.

## Steps

```powershell
cd C:\Users\Erik\Documents\NyumbaTrack
git fetch origin main
Set-ExecutionPolicy -Scope Process RemoteSigned
.\AUTO-PUSH-BILLING.ps1
```

Expected output:

```
Patch size: 41586 bytes
[main -> cursor/billing-admin-live-5791]
Add PC billing admin panel and MoMo approval API
push succeeded
```

## Create PR

https://github.com/kakaireerick-code/NyumbaTrack/compare/main...cursor/billing-admin-live-5791

Should show ~16 changed files including:

- `src/pages/BillingAdminPage.jsx`
- `src/lib/billingAdmin.ts`
- `api/subscription.ts` (GET list + PATCH approve/reject)
- `docs/BILLING-ADMIN.md`

## Before merging — quick check

```powershell
git fetch origin
git log origin/main..origin/cursor/billing-admin-live-5791 --oneline
```

- **Empty** → push failed; do not open PR
- **One commit** `Add PC billing admin panel...` → create and merge PR

## After merge

1. Redeploy Vercel (or wait for `deploy.yml`)
2. Sign in as `VITE_BILLING_ADMIN_EMAIL`
3. **Settings → More tools → Billing admin**
4. `npm run verify:features` → F15 PASS

## Manual fallback (no PS1)

```powershell
git checkout -B cursor/billing-admin-live-5791 origin/main
git apply --whitespace=fix BILLING-ADMIN-ONLY.patch
git add -A
git commit -m "Add PC billing admin panel and MoMo approval API"
git push -u origin cursor/billing-admin-live-5791 --force-with-lease
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `git apply` failed | `git checkout -B cursor/billing-admin-live-5791 origin/main` and re-run |
| Wrong origin (ULTT) | `git remote set-url origin https://github.com/kakaireerick-code/NyumbaTrack.git` |
| Patch size not ~41 KB | Re-copy `AUTO-PUSH-BILLING.ps1` from latest agent branch |
| PR shows 0 commits | Push did not reach GitHub — check `gh auth status` as **you** |

## MoMo approval flow

1. Customer pays MTN MoMo to `0793068911` and submits reference on **Plans & Billing**
2. Claim stored in Upstash as `pending_verification`
3. Operator opens **Billing admin**, loads claims with `BILLING_ADMIN_SECRET`
4. Operator verifies MoMo on phone → **Approve MoMo**
5. Customer subscription can be activated manually or via future sync job

## Environment (Vercel Production)

| Variable | Required for |
|----------|----------------|
| `UPSTASH_REDIS_REST_URL` | Storing claims |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |
| `BILLING_ADMIN_SECRET` | Admin API + panel |
| `VITE_BILLING_ADMIN_EMAIL` | Who sees Billing admin link |

Generate secret: `.\SETUP-BILLING-ADMIN.ps1`

## FAQ

**Q: Why is Billing admin hidden?**  
A: The More tools link only appears when your login email matches `VITE_BILLING_ADMIN_EMAIL`.

**Q: Load claims returns 401**  
A: `BILLING_ADMIN_SECRET` in the panel must match Vercel Production exactly.

**Q: Load claims returns 503**  
A: Add Upstash Redis URL + token on Vercel and redeploy.

**Q: Customer still pending after approve**  
A: Approval updates Redis. Owner must refresh or wait for a future auto-sync; tell them approval is complete.

**Q: Can caretakers see this page?**  
A: No — RBAC blocks non-owner roles; billing-admin is owner-only plus email gate.

**Q: Compare link shows nothing**  
A: Run `git log origin/main..origin/cursor/billing-admin-live-5791 --oneline` locally. Empty means push failed.

**Q: Patch size in Explorer**  
A: `BILLING-ADMIN-ONLY.patch` ≈ 41,586 bytes. `AUTO-PUSH-BILLING.ps1` ≈ 57 KB (includes embedded patch).

**Q: Which domain is production?**  
A: After deploy, use `npm run ops:guardrail` against `https://nyumbatrack.vercel.app` or `https://nyumbatracker.vercel.app` — alias both in Vercel if needed.
