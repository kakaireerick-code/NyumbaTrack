# NyumbaTrack

Multi-landlord rental management — React + TypeScript + Vite, local-first with role-locked portals.

## Entry URLs

| Role | URL | Notes |
|------|-----|-------|
| **Property owner** | `/login` or `/owner` | Sign in / manage portfolio |
| **Owner signup** | `/owner/signup` or `/signup` | Create subscriber account |
| **Tenant** | `/join/tenant/{CODE}` | Invite link from owner — free for tenants |
| **Caretaker** | `/join/caretaker/{CODE}` | Ops access only — no rent amounts |
| **Receipt** | `/receipt/{id}` or `/tenant/receipts/{id}` | Read-only payment receipt |

There is no generic `/join` picker and no role switcher. Each portal is isolated.

## Quick start

```bash
npm install
npm run dev:ensure   # installs deps if needed → http://localhost:5173
npm run dev          # vite dev server (port 5173)
npm run build
npm test
```

### Demo credentials (development only)

Hidden in production builds.

| Role | Email | Password | Where to sign in |
|------|-------|----------|------------------|
| Owner | `owner@demo.com` | `owner123` | `/login` |
| Tenant | `tenant@demo.com` | `tenant123` | `/join/tenant` (any code in dev) |
| Caretaker | `keeper@demo.com` | `keeper123` | `/join/caretaker` |

## Architecture

- **Routing**: `useState` page shell in `App.jsx`; path parsed once via `src/lib/routing.ts`
- **Permissions**: `src/lib/permissions.ts` — `canAccessPage`, `canViewField`, `getCaretakerSafeRecord`, `assertOwnerOnly`
- **Storage**: `safeGet` / `safeSet` in `src/lib/storage.ts`
- **Invites**: `src/lib/invites.ts` — tenant and caretaker codes with role validation
- **Receipts**: `src/lib/receiptStore.ts` + `src/pages/ReceiptPage.jsx`

## Documentation

- [Role & permission matrix](docs/ROLES-AND-PERMISSIONS.md)
- [Receipt flow](docs/RECEIPTS.md)
- [Vercel deployment & troubleshooting](docs/DEPLOY.md)

## Production (Vercel)

GitHub `main` has the full RBAC app. If [nyumbatrack.vercel.app](https://nyumbatrack.vercel.app/) still shows an old marketing page or `/login` 404s, Vercel is not linked to this repo — see **[docs/DEPLOY.md](docs/DEPLOY.md)** to reconnect.

After a correct deploy, `/login` shows owner sign-in and a small **build** stamp (git SHA) in the bottom-right corner so you can confirm the live site matches `main`.


## Manual QA checklist

- [ ] Open tenant invite on phone — only tenant join visible
- [ ] Open caretaker invite — no rent columns anywhere
- [ ] Tenant opens receipt — print/PDF works, cannot edit
- [ ] Owner logs in only at owner login — no impersonation
- [ ] Wrong-role invite code shows neutral error (no role hints)
- [ ] Owner credentials rejected on tenant/caretaker join with generic error

## Tests

```bash
npm test
```

Covers join isolation, portal auth, caretaker redaction, receipt immutability, and routing.
