# Billing admin panel (PC operator)

Platform operator approves MoMo subscription payments after customers submit references on **Plans & Billing**.

## Access

- Sign in with the email matching `VITE_BILLING_ADMIN_EMAIL` on Vercel Production.
- **Settings → More tools → Billing admin**
- Or open **https://nyumbatracker.vercel.app/billing-admin** directly (deep link).
- Paste `BILLING_ADMIN_SECRET` (from `SETUP-BILLING-ADMIN.ps1` / Vercel env).

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/subscription` | `Bearer BILLING_ADMIN_SECRET` | List all claims |
| `PATCH` | `/api/subscription` | same | `{ action, momoReference, note? }` approve/reject |
| `POST` | `/api/subscription` | public | Customer submits `pending_verification` claim |

Requires Upstash Redis env vars on Vercel.

## Deploy this branch

```powershell
.\AUTO-PUSH-BILLING.ps1
```

Then merge PR: `main...cursor/billing-admin-live-5791`
