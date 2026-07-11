# PowerShell owner guide (Erik PC)

**Folder:** `C:\Users\Erik\Documents\NyumbaTrack`  
**Production:** https://nyumbatracker.vercel.app  
**Billing admin:** https://nyumbatracker.vercel.app/billing-admin

---

## Daily workflow (use this)

```powershell
cd C:\Users\Erik\Documents\NyumbaTrack
git pull origin main
Set-ExecutionPolicy -Scope Process RemoteSigned
.\OWNER-SYNC.ps1
```

`OWNER-SYNC.ps1` pulls `main`, runs `npm run ops:guardrail` against **nyumbatracker.vercel.app**, and prints billing-admin link.

---

## One-time / setup scripts

| Script | When to use |
|--------|-------------|
| `SETUP-BILLING-ADMIN.ps1` | Generate `BILLING_ADMIN_SECRET` + admin email for Vercel |
| `SETUP-VERCEL-NYUMBA.cmd` | Find `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` |
| `OWNER-SYNC.ps1` | **Daily** — sync + production check |

---

## Shipped — SKIP (already on main)

| Script | Status |
|--------|--------|
| `AUTO-PUSH-BILLING.ps1` | PR #31 merged — exits with SKIP |
| `PUSH-DEEPLINK.ps1` | PR #32 merged — exits with SKIP |
| `MERGE-NOW.ps1` | Obsolete — do not use |
| `RUN-BILLING-NOW.ps1` | Obsolete — do not use |

---

## Legacy / agent patches

| Script | Purpose |
|--------|---------|
| `PUSH-NOW.ps1` | Runs `OWNER-SYNC` first, then optional `APPLY-ALL.patch` push |
| `PUSH-PS-CLEANUP.ps1` | One-time ship of guardrail + PS cleanup (if not yet on main) |

---

## MoMo approval (daily)

1. Open https://nyumbatracker.vercel.app/billing-admin
2. Sign in as `VITE_BILLING_ADMIN_EMAIL`
3. Paste `BILLING_ADMIN_SECRET` → **Load claims**
4. Verify MoMo on phone → **Approve MoMo**

---

## Guardrail

Default URL is now **nyumbatracker.vercel.app** (not nyumbatrack.vercel.app — that domain serves the old Kenyan app).

```powershell
npm run ops:guardrail
# or explicitly:
$env:GUARDRAIL_URL = "https://nyumbatracker.vercel.app"
npm run ops:guardrail
```

Target: **4/4 PASS**

---

## Wrong git remote?

```powershell
git remote set-url origin https://github.com/kakaireerick-code/NyumbaTrack.git
```

---

## Archived guides

See `docs/archive/PUSH-GUIDES-ARCHIVED.md` for old AUTO-PUSH / MERGE-NOW instructions.
