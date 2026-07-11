# Vercel secrets — 10-minute checklist (owner action)

The NyumbaTrack **agent cannot paste your secrets** (GitHub blocks it). **You** add them once; then deploy runs automatically.

Production is stale when deploy workflow logs: **"Vercel secrets not set — skip deploy"**.

See also: [GitHub issue #24](https://github.com/kakaireerick-code/NyumbaTrack/issues/24)

---

## Step 1 — Vercel token (1 min)

1. https://vercel.com/account/tokens
2. **Create Token** → name: `nyumbatrack-github-actions`
3. Copy the token (shown once)

## Step 2 — Find project IDs (2 min)

```bash
cd NyumbaTrack
VERCEL_TOKEN=your_token_here node scripts/vercel-setup-helper.mjs
```

Copy printed `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.

**Windows:** double-click `SETUP-VERCEL-NYUMBA.cmd` (paste token when prompted).

## Step 3 — GitHub Actions secrets (2 min)

https://github.com/kakaireerick-code/NyumbaTrack/settings/secrets/actions

| Name | Value |
|------|--------|
| `VERCEL_TOKEN` | Step 1 |
| `VERCEL_ORG_ID` | Step 2 |
| `VERCEL_PROJECT_ID` | Step 2 |

## Step 4 — Connect Git on Vercel (2 min)

1. Vercel Dashboard → project **nyumbatrack**
2. **Settings → Git** → `kakaireerick-code/NyumbaTrack` branch **main**

## Step 5 — Upstash Redis (3 min)

1. https://console.upstash.com → Create Redis database
2. **REST API** tab → copy URL + token

## Step 6 — Vercel env vars (Production)

| Variable | Value |
|----------|--------|
| `UPSTASH_REDIS_REST_URL` | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash |
| `BILLING_ADMIN_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` or run `SETUP-BILLING-ADMIN.ps1` |
| `VITE_BILLING_ADMIN_EMAIL` | your Gmail |

## Step 7 — Deploy

- **Actions** → **Deploy to Vercel** → **Run workflow** → `main`
- Or Vercel → **Redeploy** latest `main`

Deploy should take **1–3 minutes** (not ~6 seconds).

## Step 8 — Confirm

```bash
npm run ops:guardrail
```

Or on Windows: `.\OWNER-SYNC.ps1` (pulls main + guardrail).

**Pass when:**

- Bundle ≠ `index-B0iUFD94.js`
- Title says **Ugandan** (not Kenyan)
- `/api/health` → JSON `"ok":true`

## Step 9 — Billing admin panel (optional)

After deploy, open **Settings → More tools → Billing admin** (admin email only).  
See `docs/BILLING-ADMIN.md` and run `AUTO-PUSH-BILLING.ps1` if the panel is not on `main` yet.

**Deep link:** https://nyumbatracker.vercel.app/billing-admin (sign in as admin email first).

## Tell the agent when done

Comment on issue #20:

```
Secrets added. Deploy workflow re-run. ops:guardrail: [paste output]
```
