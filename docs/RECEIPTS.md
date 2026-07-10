# Receipts

Receipts are **immutable, read-only documents** — not editable Word files or generic downloads.

## Data model

Stored in `localStorage` key `rt_receipts` via `src/lib/receiptStore.ts`.

Each receipt snapshot includes:

- `receiptId`, `receiptNo` (immutable identifiers)
- `paymentId` (optional link to payment record)
- `ownerId`, `tenantId`, `unitId`
- Payer, property/unit, period, amount, method, reference, balance
- `issuedAt`, `issuedBy`, `status`, `notes`

Snapshots are written once and never mutated by tenant views.

## Issue flow (owner only)

1. Owner records a payment on **Payments** or uses **Issue receipt** from tenant detail.
2. `issueReceipt()` in `src/utils/receipts.js` builds structured data and calls `saveReceiptSnapshot()`.
3. Owner sees receipt in modal; tenant gets access via their portal.

Only `property_owner` role can call `issueReceipt()` / `assertOwnerOnly('issue_receipt')`.

## View flow (tenant / owner)

| Route | Who |
|-------|-----|
| `/receipt/{receiptId}` | Tenant (own receipts), owner |
| `/tenant/receipts/{receiptId}` | Alias — same read-only view |

Component: `src/pages/ReceiptPage.jsx`

- Renders `PaymentReceipt` (presentational, no inputs)
- **Print / PDF** — opens print layout via `buildReceiptHtmlDocument()`
- **Save copy** — downloads HTML document
- Logo optional — layout works without uploaded logo

Caretakers are denied at route and `canViewField('receipt.amount')` level.

## Tenant portal

From **My Payments** or **My Receipts**, tenant taps **View receipt** → navigates to `/receipt/{id}` (dedicated route, not inline editor).

## Immutability guarantee

- No `contenteditable`, `input`, or `textarea` on receipt page
- `getReceiptById()` returns stored snapshot; tenant view does not write back
- Automated test: `src/pages/ReceiptPage.test.tsx`, `src/test/join-and-receipt.test.tsx`

## Print styles

`src/index.css` includes `@media print` rules for `.print-receipt` and `.no-print` action buttons.
