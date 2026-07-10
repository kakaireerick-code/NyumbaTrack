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
npm run dev
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
