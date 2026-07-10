# Role × Page × Field Matrix

NyumbaTrack has exactly three production roles. All checks go through `src/lib/permissions.ts`.

## Roles

| Role ID | Entry URL | Session scope |
|---------|-----------|---------------|
| `property_owner` | `/login`, `/owner`, `/owner/signup` | Full portfolio for `ownerId` |
| `caretaker` | `/join/caretaker/{CODE}` | Ops views only — financial fields stripped |
| `tenant` | `/join/tenant/{CODE}` | Own unit, receipts, messages — read-only financial docs |

There is **no role picker** and **no impersonation** in production UI.

## Page access

| Page | Owner | Caretaker | Tenant |
|------|:-----:|:---------:|:------:|
| dashboard | ✓ | — | — |
| buildings, units, vacancy | ✓ | units, vacancy | — |
| tenants, lease-manager | ✓ | tenants (no $) | — |
| payments, balance-tracker, deposits | ✓ | — | — |
| utilities, reminders, reports | ✓ | — | — |
| maintenance, messages | ✓ | ✓ | — |
| documents, legal-notices, settings | ✓ | — | — |
| subscription, data-import | ✓ | — | — |
| blacklist, defaulter-list | ✓ | — | — |
| help, guided, assistant | ✓ | ✓ | ✓ |
| my-balance, my-payments, my-lease | — | — | ✓ |
| my-receipts, receipt-view | ✓ | — | ✓ |
| my-messages | — | — | ✓ |

Caretakers are blocked from `receipt-view` and `my-receipts`.

## Field visibility (`canViewField`)

| Field key | Owner | Caretaker | Tenant |
|-----------|:-----:|:---------:|:------:|
| `unit.monthlyRent` | ✓ | — | — |
| `unit.depositAmount` | ✓ | — | — |
| `unit.inviteCode`, `unit.ownerNotes` | ✓ | — | — |
| `tenant.rentAmount`, `tenant.balance` | ✓ | — | ✓ (own) |
| `tenant.depositPaid`, `tenant.depositAmount` | ✓ | — | — |
| `tenant.payments` | ✓ | — | — |
| `payment.amount` | ✓ | — | — |
| `receipt.amount`, `receipt.list` | ✓ | — | ✓ (own) |
| `subscription.billing`, `owner.revenue` | ✓ | — | — |

## Caretaker redaction

`getCaretakerSafeRecord()` removes: `monthlyRent`, `depositAmount`, `rentAmount`, `depositPaid`, `balance`, `payments`, `ownerNotes`, `inviteCode`, `expenses`, `maintenanceLog`, `netYield`, `internalFlags`, `rating`, `blacklisted`, `blacklistReason`.

Applied in `App.jsx` before data reaches caretaker portal components. Never rely on CSS hiding.

## Owner-only actions (`assertOwnerOnly`)

- `issue_receipt`
- `record_payment`
- `manage_subscription`
- `create_invite`
- `import_data`

## Join security

- Wrong-role invite on a join URL → `Invalid or expired invite` (neutral)
- Owner email/password on tenant/caretaker join → `Invalid email or password` (neutral)
- Failed join attempts rate-limited in UI (`src/lib/joinRateLimit.ts`)

## Demo mode

Owner-only. Does not bypass caretaker redaction or tenant read-only rules. Hidden in production (`import.meta.env.PROD`).
