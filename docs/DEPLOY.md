# Deploying NyumbaTrack to Vercel

## Why you might not see updates

If [nyumbatrack.vercel.app](https://nyumbatrack.vercel.app/) still shows a **marketing landing page** (“Welcome back / Get Started”) and `/login` returns a **404**, Vercel is **not** serving this repository (`kakaireerick-code/NyumbaTrack`). GitHub `main` has the RBAC app; the live domain is linked to a different project or an old deployment.

After a correct deploy, `/login` shows **“Sign in to manage your rental portfolio”** and a small **build stamp** (git SHA) in the corner.

## Option A — Reconnect in Vercel Dashboard (fastest)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project for `nyumbatrack.vercel.app`.
2. **Settings → Git** → connect **GitHub** repo `kakaireerick-code/NyumbaTrack` (branch `main`).
3. **Settings → General**:
   - Framework Preset: **Vite**
   - Root Directory: **/** (repo root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
4. **Deployments → Redeploy** latest `main` (or push any commit to `main`).
5. Verify:
   - Page title: **NyumbaTrack** (not “Smart Rent Management for Kenyan Landlords”).
   - `/login` loads owner sign-in (not 404).
   - Build stamp shows current commit (e.g. `84c63e2`).

`vercel.json` in this repo sets the same build settings for Git-connected deploys.

## Option B — GitHub Actions deploy (CI-controlled)

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to find it |
|--------|------------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Project → Settings → General (Team/Org ID) |
| `VERCEL_PROJECT_ID` | Project → Settings → General (Project ID) |

On push to `main`, `.github/workflows/deploy.yml` builds and deploys. If secrets are missing, the workflow skips deploy and logs a notice (CI still runs tests via `ci.yml`).

You can also trigger manually: **Actions → Deploy to Vercel → Run workflow**.

## Local preview (always has latest code)

```bash
npm run dev:ensure   # http://localhost:5173
npm run build && npm run preview   # production build locally
```

## Verify the correct build is live

| Check | Wrong (old site) | Correct (this repo) |
|-------|------------------|---------------------|
| `<title>` | “NyumbaTrack — Smart Rent Management…” | “NyumbaTrack” |
| `/login` | 404 page | Owner login form |
| Build stamp | None | Short git SHA on login page |
