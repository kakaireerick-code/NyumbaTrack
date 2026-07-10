# Deploying NyumbaTrack to Vercel

## Why you might not see updates

If [nyumbatrack.vercel.app](https://nyumbatrack.vercel.app/) still shows a **marketing landing page** (“Welcome back / Get Started”), **Kenyan** copy, or `/login` returns a **404**, Vercel is **not** serving this repository (`kakaireerick-code/NyumbaTrack`). GitHub `main` has the RBAC app; the live domain is linked to a different project or an old deployment.

After a correct deploy:

- Page title: **NyumbaTrack — Smart Rent Management for Ugandan Landlords**
- `/login` shows owner sign-in + build stamp
- `/api/health` returns JSON `{ "ok": true, "region": "uganda" }`
- JS bundle is **not** `index-B0iUFD94.js`

Verify: `npm run ops:guardrail`

## Option A — Reconnect in Vercel Dashboard (fastest)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project for `nyumbatrack.vercel.app`.
2. **Settings → Git** → connect **GitHub** repo `kakaireerick-code/NyumbaTrack` (branch `main`).
3. **Settings → General**:
   - Framework Preset: **Vite**
   - Root Directory: **/** (repo root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
4. **Settings → Environment Variables** (Production):

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Subscription claim storage |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth |
| `BILLING_ADMIN_SECRET` | Admin API auth (`Authorization: Bearer …`) |
| `VITE_BILLING_ADMIN_EMAIL` | Shown in billing UI for support |

5. **Deployments → Redeploy** latest `main`.
6. Run `npm run ops:guardrail` until all checks pass.

`vercel.json` excludes `/api/*` from the SPA rewrite so `api/health.ts` and `api/subscription.ts` deploy as serverless functions.

## Option B — GitHub Actions deploy (CI-controlled)

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to find it |
|--------|------------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Project → Settings → General (Team/Org ID) |
| `VERCEL_PROJECT_ID` | Project → Settings → General (Project ID) |

On push to `main`, `.github/workflows/deploy.yml` builds and deploys. If secrets are missing, the workflow skips deploy and logs a notice (CI still runs tests via `ci.yml`).

You can also trigger manually: **Actions → Deploy to Vercel → Run workflow**.

Copy the same billing env vars from Option A into the Vercel project (Actions deploy uses Vercel project env).

## Local preview (always has latest code)

```bash
npm run dev:ensure   # http://localhost:5173
npm run build && npm run preview   # production build locally
```

## Verify the correct build is live

| Check | Wrong (old site) | Correct (this repo) |
|-------|------------------|---------------------|
| `<title>` | “Kenyan Landlords” | “Ugandan Landlords” |
| JS bundle | `index-B0iUFD94.js` | New hash from latest build |
| `/login` | 404 page | Owner login form |
| `/api/health` | HTML | JSON `ok: true` |
| MoMo subscribe | Instant active | `pending_verification` until admin confirms |
