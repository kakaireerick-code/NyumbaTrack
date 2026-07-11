# NyumbaTrack AUTO-PUSH-BILLING.ps1
# Embeds BILLING-ADMIN-ONLY.patch — run on Erik PC: C:\Users\Erik\Documents\NyumbaTrack\
# Branch: cursor/billing-admin-live-5791

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$Branch = "cursor/billing-admin-live-5791"
$CommitMsg = "Add PC billing admin panel and MoMo approval API"

Write-Host ""
Write-Host "AUTO-PUSH-BILLING" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$url = git remote get-url origin 2>$null
if ($url -match "ultt|land-tax" -and $url -notmatch "Nyumba|nyumba") {
  Write-Host "Fixing wrong origin: $url" -ForegroundColor Yellow
  git remote set-url origin $RepoHttps
}

$embeddedPatch = @'
diff --git a/api/subscription.ts b/api/subscription.ts
index 8d74c65..0e97ea3 100644
--- a/api/subscription.ts
+++ b/api/subscription.ts
@@ -1,5 +1,12 @@
 import type { VercelRequest, VercelResponse } from ''@vercel/node''
 import { Redis } from ''@upstash/redis''
+import {
+  applyReview,
+  parseReviewBody,
+  sortClaimsNewestFirst,
+  validateClaimPayload,
+  type StoredClaim,
+} from ''../src/lib/subscriptionApiHelpers''
 
 type ClaimBody = {
   customerEmail?: string
@@ -10,6 +17,12 @@ type ClaimBody = {
   momoReference?: string
 }
 
+type ReviewBody = {
+  action?: ''approve'' | ''reject''
+  momoReference?: string
+  note?: string
+}
+
 const redis = () => {
   const url = process.env.UPSTASH_REDIS_REST_URL
   const token = process.env.UPSTASH_REDIS_REST_TOKEN
@@ -19,19 +32,59 @@ const redis = () => {
 
 const claimKey = (ref: string) => `subscription:claim:${ref.toLowerCase()}`
 
+const requireAdmin = (req: VercelRequest): string | null => {
+  const adminSecret = process.env.BILLING_ADMIN_SECRET
+  const auth = String(req.headers.authorization || '''').replace(/^Bearer\s+/i, '''')
+  if (!adminSecret || auth !== adminSecret) return null
+  return adminSecret
+}
+
+const listClaims = async (r: Redis): Promise<StoredClaim[]> => {
+  const keys = await r.keys(''subscription:claim:*'')
+  if (!keys.length) return []
+  const rows = await Promise.all(keys.map((key) => r.get<StoredClaim>(key)))
+  return sortClaimsNewestFirst(rows.filter(Boolean) as StoredClaim[])
+}
+
 export default async function handler(req: VercelRequest, res: VercelResponse) {
   res.setHeader(''Cache-Control'', ''no-store'')
 
   if (req.method === ''GET'') {
-    const adminSecret = process.env.BILLING_ADMIN_SECRET
-    const auth = String(req.headers.authorization || '''').replace(/^Bearer\s+/i, '''')
-    if (!adminSecret || auth !== adminSecret) {
+    if (!requireAdmin(req)) {
+      return res.status(401).json({ ok: false, error: ''Unauthorized'' })
+    }
+    const r = redis()
+    if (!r) return res.status(503).json({ ok: false, error: ''Redis not configured'' })
+    const claims = await listClaims(r)
+    const pending = claims.filter((c) => c.status === ''pending_verification'').length
+    return res.status(200).json({ ok: true, pending, claims })
+  }
+
+  if (req.method === ''PATCH'') {
+    if (!requireAdmin(req)) {
       return res.status(401).json({ ok: false, error: ''Unauthorized'' })
     }
     const r = redis()
     if (!r) return res.status(503).json({ ok: false, error: ''Redis not configured'' })
-    const pending = await r.keys(''subscription:claim:*'')
-    return res.status(200).json({ ok: true, pending: pending.length })
+
+    const body = (req.body || {}) as ReviewBody
+    const { action, momoReference, note } = parseReviewBody(body as Record<string, unknown>)
+    if (!action || !momoReference) {
+      return res.status(400).json({ ok: false, error: ''action and momoReference required'' })
+    }
+
+    const key = claimKey(momoReference)
+    const existing = await r.get<StoredClaim>(key)
+    if (!existing) {
+      return res.status(404).json({ ok: false, error: ''Claim not found'' })
+    }
+    if (existing.status !== ''pending_verification'') {
+      return res.status(409).json({ ok: false, error: `Claim already ${existing.status}` })
+    }
+
+    const updated = applyReview(existing, action, note)
+    await r.set(key, updated)
+    return res.status(200).json({ ok: true, claim: updated })
   }
 
   if (req.method !== ''POST'') {
@@ -39,18 +92,14 @@ export default async function handler(req: VercelRequest, res: VercelResponse) {
   }
 
   const body = (req.body || {}) as ClaimBody
-  const customerEmail = String(body.customerEmail || '''').trim().toLowerCase()
-  const momoReference = String(body.momoReference || '''').trim()
-  const planId = String(body.planId || '''').trim()
-  const billingCycle = String(body.billingCycle || ''monthly'').trim()
-  const amount = Number(body.amount || 0)
-
-  if (!customerEmail || !momoReference || momoReference.length < 6 || !planId || !amount) {
+  const parsed = validateClaimPayload(body as Record<string, unknown>)
+  if (!parsed.ok) {
     return res.status(400).json({ ok: false, error: ''Invalid claim payload'' })
   }
+  const { customerEmail, momoReference, planId, billingCycle, amount } = parsed
 
   const r = redis()
-  const claim = {
+  const claim: StoredClaim = {
     id: `claim-${Date.now()}`,
     customerEmail,
     customerName: String(body.customerName || ''Customer''),
@@ -63,7 +112,7 @@ export default async function handler(req: VercelRequest, res: VercelResponse) {
   }
 
   if (r) {
-    const existing = await r.get(claimKey(momoReference))
+    const existing = await r.get<StoredClaim>(claimKey(momoReference))
     if (existing) {
       return res.status(409).json({ ok: false, error: ''Transaction reference already submitted'' })
     }
diff --git a/docs/BILLING-ADMIN-PUSH.md b/docs/BILLING-ADMIN-PUSH.md
new file mode 100644
index 0000000..781f2dc
--- /dev/null
+++ b/docs/BILLING-ADMIN-PUSH.md
@@ -0,0 +1,122 @@
+# AUTO-PUSH billing admin — owner PC walkthrough
+
+Use when `BillingAdminPage.jsx` is not on `main` yet.
+
+## Files
+
+| File | Size (approx) | Purpose |
+|------|---------------|---------|
+| `AUTO-PUSH-BILLING.ps1` | 57 KB | Embeds patch + git push |
+| `BILLING-ADMIN-ONLY.patch` | 41 KB | Standalone patch (also inside PS1) |
+
+You only need **one** of them — prefer `AUTO-PUSH-BILLING.ps1`.
+
+## Steps
+
+```powershell
+cd C:\Users\Erik\Documents\NyumbaTrack
+git fetch origin main
+Set-ExecutionPolicy -Scope Process RemoteSigned
+.\AUTO-PUSH-BILLING.ps1
+```
+
+Expected output:
+
+```
+Patch size: 41586 bytes
+[main -> cursor/billing-admin-live-5791]
+Add PC billing admin panel and MoMo approval API
+push succeeded
+```
+
+## Create PR
+
+https://github.com/kakaireerick-code/NyumbaTrack/compare/main...cursor/billing-admin-live-5791
+
+Should show ~16 changed files including:
+
+- `src/pages/BillingAdminPage.jsx`
+- `src/lib/billingAdmin.ts`
+- `api/subscription.ts` (GET list + PATCH approve/reject)
+- `docs/BILLING-ADMIN.md`
+
+## Before merging — quick check
+
+```powershell
+git fetch origin
+git log origin/main..origin/cursor/billing-admin-live-5791 --oneline
+```
+
+- **Empty** → push failed; do not open PR
+- **One commit** `Add PC billing admin panel...` → create and merge PR
+
+## After merge
+
+1. Redeploy Vercel (or wait for `deploy.yml`)
+2. Sign in as `VITE_BILLING_ADMIN_EMAIL`
+3. **Settings → More tools → Billing admin**
+4. `npm run verify:features` → F15 PASS
+
+## Manual fallback (no PS1)
+
+```powershell
+git checkout -B cursor/billing-admin-live-5791 origin/main
+git apply --whitespace=fix BILLING-ADMIN-ONLY.patch
+git add -A
+git commit -m "Add PC billing admin panel and MoMo approval API"
+git push -u origin cursor/billing-admin-live-5791 --force-with-lease
+```
+
+## Troubleshooting
+
+| Problem | Fix |
+|---------|-----|
+| `git apply` failed | `git checkout -B cursor/billing-admin-live-5791 origin/main` and re-run |
+| Wrong origin (ULTT) | `git remote set-url origin https://github.com/kakaireerick-code/NyumbaTrack.git` |
+| Patch size not ~41 KB | Re-copy `AUTO-PUSH-BILLING.ps1` from latest agent branch |
+| PR shows 0 commits | Push did not reach GitHub — check `gh auth status` as **you** |
+
+## MoMo approval flow
+
+1. Customer pays MTN MoMo to `0793068911` and submits reference on **Plans & Billing**
+2. Claim stored in Upstash as `pending_verification`
+3. Operator opens **Billing admin**, loads claims with `BILLING_ADMIN_SECRET`
+4. Operator verifies MoMo on phone → **Approve MoMo**
+5. Customer subscription can be activated manually or via future sync job
+
+## Environment (Vercel Production)
+
+| Variable | Required for |
+|----------|----------------|
+| `UPSTASH_REDIS_REST_URL` | Storing claims |
+| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |
+| `BILLING_ADMIN_SECRET` | Admin API + panel |
+| `VITE_BILLING_ADMIN_EMAIL` | Who sees Billing admin link |
+
+Generate secret: `.\SETUP-BILLING-ADMIN.ps1`
+
+## FAQ
+
+**Q: Why is Billing admin hidden?**  
+A: The More tools link only appears when your login email matches `VITE_BILLING_ADMIN_EMAIL`.
+
+**Q: Load claims returns 401**  
+A: `BILLING_ADMIN_SECRET` in the panel must match Vercel Production exactly.
+
+**Q: Load claims returns 503**  
+A: Add Upstash Redis URL + token on Vercel and redeploy.
+
+**Q: Customer still pending after approve**  
+A: Approval updates Redis. Owner must refresh or wait for a future auto-sync; tell them approval is complete.
+
+**Q: Can caretakers see this page?**  
+A: No — RBAC blocks non-owner roles; billing-admin is owner-only plus email gate.
+
+**Q: Compare link shows nothing**  
+A: Run `git log origin/main..origin/cursor/billing-admin-live-5791 --oneline` locally. Empty means push failed.
+
+**Q: Patch size in Explorer**  
+A: `BILLING-ADMIN-ONLY.patch` ≈ 41,586 bytes. `AUTO-PUSH-BILLING.ps1` ≈ 57 KB (includes embedded patch).
+
+**Q: Which domain is production?**  
+A: After deploy, use `npm run ops:guardrail` against `https://nyumbatrack.vercel.app` or `https://nyumbatracker.vercel.app` — alias both in Vercel if needed.
diff --git a/docs/BILLING-ADMIN.md b/docs/BILLING-ADMIN.md
new file mode 100644
index 0000000..cb59917
--- /dev/null
+++ b/docs/BILLING-ADMIN.md
@@ -0,0 +1,27 @@
+# Billing admin panel (PC operator)
+
+Platform operator approves MoMo subscription payments after customers submit references on **Plans & Billing**.
+
+## Access
+
+- Sign in with the email matching `VITE_BILLING_ADMIN_EMAIL` on Vercel Production.
+- **Settings → More tools → Billing admin**
+- Paste `BILLING_ADMIN_SECRET` (from `SETUP-BILLING-ADMIN.ps1` / Vercel env).
+
+## API
+
+| Method | Path | Auth | Purpose |
+|--------|------|------|---------|
+| `GET` | `/api/subscription` | `Bearer BILLING_ADMIN_SECRET` | List all claims |
+| `PATCH` | `/api/subscription` | same | `{ action, momoReference, note? }` approve/reject |
+| `POST` | `/api/subscription` | public | Customer submits `pending_verification` claim |
+
+Requires Upstash Redis env vars on Vercel.
+
+## Deploy this branch
+
+```powershell
+.\AUTO-PUSH-BILLING.ps1
+```
+
+Then merge PR: `main...cursor/billing-admin-live-5791`
diff --git a/docs/MASTER-VERIFY-LOOP.md b/docs/MASTER-VERIFY-LOOP.md
index ce5fc08..f42f89e 100644
--- a/docs/MASTER-VERIFY-LOOP.md
+++ b/docs/MASTER-VERIFY-LOOP.md
@@ -1,9 +1,9 @@
-# Master verify loop — F1–F14
+# Master verify loop — F1–F15
 
 Run every turn:
 
 ```bash
-npm run verify:features   # F1–F14 local checks
+npm run verify:features   # F1–F15 local checks
 npm test && npm run build
 npm run ops:guardrail     # production (after deploy)
 ```
@@ -26,6 +26,15 @@ npm run ops:guardrail     # production (after deploy)
 | F12 | RBAC isolation | `permissions.ts` blocks tenant/caretaker leaks |
 | F13 | MoMo ref validation | `momoVerification.ts` |
 | F14 | Guardrail script | `scripts/ops-guardrail.mjs` + npm script |
+| F15 | Billing admin panel | `BillingAdminPage.jsx` + PATCH `/api/subscription` |
+
+## F15 — Billing admin (PC operator)
+
+1. Sign in as `VITE_BILLING_ADMIN_EMAIL`
+2. **Settings → More tools → Billing admin**
+3. Paste `BILLING_ADMIN_SECRET` → **Load claims**
+4. Submit test MoMo on **Plans & Billing** → claim appears as `pending_verification`
+5. **Approve MoMo** → claim status `approved` in Redis
 
 ## Loop per feature
 
@@ -36,7 +45,7 @@ Log: CONFIRMED F# at <commit-sha>
 
 ## Done when
 
-- All F1–F14 CONFIRMED locally
+- All F1–F15 CONFIRMED locally
 - `npm run ops:guardrail` → 4/4 PASS on production
 - Bundle ≠ `index-B0iUFD94.js`
 - `/api/health` returns JSON
diff --git a/docs/VERCEL-SECRETS-CHECKLIST.md b/docs/VERCEL-SECRETS-CHECKLIST.md
index eba01ec..792df1d 100644
--- a/docs/VERCEL-SECRETS-CHECKLIST.md
+++ b/docs/VERCEL-SECRETS-CHECKLIST.md
@@ -73,6 +73,11 @@ npm run ops:guardrail
 - Title says **Ugandan** (not Kenyan)
 - `/api/health` → JSON `"ok":true`
 
+## Step 9 — Billing admin panel (optional)
+
+After deploy, open **Settings → More tools → Billing admin** (admin email only).  
+See `docs/BILLING-ADMIN.md` and run `AUTO-PUSH-BILLING.ps1` if the panel is not on `main` yet.
+
 ## Tell the agent when done
 
 Comment on issue #20:
diff --git a/package.json b/package.json
index 195d44a..698309d 100644
--- a/package.json
+++ b/package.json
@@ -13,7 +13,8 @@
     "test:watch": "vitest",
     "ops:guardrail": "node scripts/ops-guardrail.mjs",
     "verify:features": "node scripts/verify-features.mjs",
-    "vercel:setup": "node scripts/vercel-setup-helper.mjs"
+    "vercel:setup": "node scripts/vercel-setup-helper.mjs",
+    "billing:admin-docs": "node -e \"console.log(''See docs/BILLING-ADMIN.md and run AUTO-PUSH-BILLING.ps1 on Windows'')\""
   },
   "dependencies": {
     "@react-oauth/google": "^0.13.5",
diff --git a/scripts/verify-features.mjs b/scripts/verify-features.mjs
index beae2f8..c78b89a 100644
--- a/scripts/verify-features.mjs
+++ b/scripts/verify-features.mjs
@@ -123,6 +123,18 @@ confirm(
   ''ops:guardrail npm script'',
 )
 
+// F15 Billing admin panel
+const billingAdminPage = exists(''src/pages/BillingAdminPage.jsx'') ? read(''src/pages/BillingAdminPage.jsx'') : ''''
+const subApi = exists(''api/subscription.ts'') ? read(''api/subscription.ts'') : ''''
+confirm(
+  ''F15'',
+  ''Billing admin panel'',
+  billingAdminPage.includes(''Billing admin'') &&
+    subApi.includes("req.method === ''PATCH''") &&
+    exists(''src/lib/billingAdmin.ts''),
+  ''BillingAdminPage + MoMo approval API'',
+)
+
 const failed = checks.filter((c) => !c.ok)
 const sha = (() => {
   try {
@@ -134,6 +146,6 @@ const sha = (() => {
 
 console.log(`\n${failed.length ? ''FAIL'' : ''PASS''} — ${checks.length - failed.length}/${checks.length} features`)
 if (!failed.length) {
-  console.log(`\nAll F1–F14 CONFIRMED at ${sha}`)
+  console.log(`\nAll F1–F15 CONFIRMED at ${sha}`)
 }
 process.exit(failed.length ? 1 : 0)
diff --git a/src/App.jsx b/src/App.jsx
index ac88a18..69795d0 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -41,6 +41,7 @@ import TenantPortalPage from ''./pages/TenantPortalPage''
 import DataImportPage from ''./pages/DataImportPage''
 import AgreementUploadModal from ''./components/AgreementUploadModal''
 import SubscriptionPage from ''./pages/SubscriptionPage''
+import BillingAdminPage from ''./pages/BillingAdminPage''
 import SubscriptionBanner from ''./components/SubscriptionBanner''
 import TenantBottomNav from ''./components/TenantBottomNav''
 import { usePersistedState } from ''./utils/storage''
@@ -63,6 +64,7 @@ import { countUnreadForOwner } from ''./lib/messages''
 import { getUsers, saveUsers } from ''./lib/auth''
 import { isoToday } from ''./lib/dates''
 import { getStoredTheme, persistTheme } from ''./lib/theme''
+import { isBillingAdminEmail } from ''./lib/billingAdmin''
 import {
   initialBuildings,
   initialUnits,
@@ -294,6 +296,10 @@ function AppContent() {
 
   const setPageSafe = useCallback((page) => {
     const rk = normalizeRole(currentRole)
+    if (page === ''billing-admin'' && !isBillingAdminEmail(authUser?.email)) {
+      showToast(''Billing admin is restricted to the platform operator email.'', ''error'')
+      return
+    }
     if (rk === ''tenant'' && TENANT_BLOCKED_PAGES.includes(page)) {
       showToast(''This area is not available.'', ''error'')
       setCurrentPage(''my-balance'')
@@ -305,7 +311,7 @@ function AppContent() {
       showToast(''You do not have access to that page.'', ''error'')
       setCurrentPage(defaultPageForRole(rk))
     }
-  }, [currentRole, showToast])
+  }, [currentRole, authUser?.email, showToast])
 
   useEffect(() => {
     if (!isLoggedIn || authUser?.role !== ''tenant'') return
@@ -718,6 +724,7 @@ function AppContent() {
             {...sharedProps}
             onRestartTour={() => setShowTour(true)}
             setCurrentPage={setPageSafe}
+            authUser={authUser}
           />
         )
       case ''blacklist'':
@@ -736,6 +743,8 @@ function AppContent() {
             settings={settings}
           />
         )
+      case ''billing-admin'':
+        return <BillingAdminPage showToast={showToast} authUser={authUser} />
       default:
         return <DashboardPage {...sharedProps} />
     }
diff --git a/src/lib/billingAdmin.test.ts b/src/lib/billingAdmin.test.ts
new file mode 100644
index 0000000..5a6f456
--- /dev/null
+++ b/src/lib/billingAdmin.test.ts
@@ -0,0 +1,12 @@
+import { describe, expect, it } from ''vitest''
+import { isBillingAdminEmail } from ''./billingAdmin''
+
+describe(''isBillingAdminEmail'', () => {
+  it(''matches configured admin email case-insensitively'', () => {
+    const prev = import.meta.env.VITE_BILLING_ADMIN_EMAIL
+    import.meta.env.VITE_BILLING_ADMIN_EMAIL = ''Admin@Example.com''
+    expect(isBillingAdminEmail(''admin@example.com'')).toBe(true)
+    expect(isBillingAdminEmail(''other@example.com'')).toBe(false)
+    import.meta.env.VITE_BILLING_ADMIN_EMAIL = prev
+  })
+})
diff --git a/src/lib/billingAdmin.ts b/src/lib/billingAdmin.ts
new file mode 100644
index 0000000..4d8ee30
--- /dev/null
+++ b/src/lib/billingAdmin.ts
@@ -0,0 +1,50 @@
+export type BillingClaim = {
+  id: string
+  customerEmail: string
+  customerName: string
+  planId: string
+  billingCycle: string
+  amount: number
+  momoReference: string
+  status: string
+  submittedAt: string
+  reviewedAt?: string
+  reviewNote?: string
+}
+
+const authHeaders = (secret: string) => ({
+  Authorization: `Bearer ${secret}`,
+  ''Content-Type'': ''application/json'',
+})
+
+export const isBillingAdminEmail = (email: string | undefined | null): boolean => {
+  const admin = String(import.meta.env.VITE_BILLING_ADMIN_EMAIL || '''').trim().toLowerCase()
+  if (!admin) return false
+  return String(email || '''').trim().toLowerCase() === admin
+}
+
+export const fetchPendingClaims = async (secret: string): Promise<BillingClaim[]> => {
+  const res = await fetch(''/api/subscription'', { headers: authHeaders(secret) })
+  const data = await res.json().catch(() => ({}))
+  if (!res.ok) throw new Error(data.error || `List failed (${res.status})`)
+  return Array.isArray(data.claims) ? data.claims : []
+}
+
+export const reviewClaim = async (
+  secret: string,
+  momoReference: string,
+  action: ''approve'' | ''reject'',
+  note = '''',
+): Promise<BillingClaim> => {
+  const res = await fetch(''/api/subscription'', {
+    method: ''PATCH'',
+    headers: authHeaders(secret),
+    body: JSON.stringify({ action, momoReference, note }),
+  })
+  const data = await res.json().catch(() => ({}))
+  if (!res.ok) throw new Error(data.error || `Review failed (${res.status})`)
+  return data.claim as BillingClaim
+}
+
+/** sessionStorage key — cleared when browser session ends */
+export const BILLING_ADMIN_SECRET_KEY = ''nyumba_billing_admin_secret''
diff --git a/src/lib/navigation.test.ts b/src/lib/navigation.test.ts
index 2451b6c..7e03d84 100644
--- a/src/lib/navigation.test.ts
+++ b/src/lib/navigation.test.ts
@@ -12,6 +12,7 @@ describe(''navigation'', () => {
   it(''more tools includes billing and import'', () => {
     const ids = MORE_TOOLS_LINKS.map((t) => t.id)
     expect(ids).toContain(''subscription'')
+    expect(ids).toContain(''billing-admin'')
     expect(ids).toContain(''data-import'')
     expect(ids).toContain(''guided'')
   })
diff --git a/src/lib/navigation.ts b/src/lib/navigation.ts
index bbe61d1..c666d3c 100644
--- a/src/lib/navigation.ts
+++ b/src/lib/navigation.ts
@@ -17,6 +17,7 @@ export type MoreToolLink = { id: PageId; label: string; description: string }
 /** Advanced tools — reachable from Settings → More tools */
 export const MORE_TOOLS_LINKS: MoreToolLink[] = [
   { id: ''subscription'', label: ''Plans & Billing'', description: ''MoMo subscription, yearly plans, invoices'' },
+  { id: ''billing-admin'', label: ''Billing admin'', description: ''Approve MoMo payments (admin email only)'' },
   { id: ''data-import'', label: ''Data Import'', description: ''Excel/CSV/Word tenant import'' },
   { id: ''guided'', label: ''Guided Steps'', description: ''Step-by-step workflows'' },
   { id: ''assistant'', label: ''Ask Assistant'', description: ''In-app help assistant'' },
diff --git a/src/lib/permissions.test.ts b/src/lib/permissions.test.ts
index 4a4f097..88d08ec 100644
--- a/src/lib/permissions.test.ts
+++ b/src/lib/permissions.test.ts
@@ -20,11 +20,16 @@ describe(''permissions'', () => {
   it(''blocks tenant from owner routes'', () => {
     expect(canAccessPage(''tenant'', ''dashboard'')).toBe(false)
     expect(canAccessPage(''tenant'', ''subscription'')).toBe(false)
+    expect(canAccessPage(''tenant'', ''billing-admin'')).toBe(false)
     expect(canAccessPage(''tenant'', ''payments'')).toBe(false)
     expect(canAccessPage(''tenant'', ''my-balance'')).toBe(true)
     expect(canAccessPage(''tenant'', ''my-receipts'')).toBe(true)
   })
 
+  it(''allows owner billing admin page in RBAC map'', () => {
+    expect(canAccessPage(''property_owner'', ''billing-admin'')).toBe(true)
+  })
+
   it(''blocks caretaker from receipts and financial fields'', () => {
     expect(canAccessPage(''caretaker'', ''receipt-view'')).toBe(false)
     expect(canAccessPage(''caretaker'', ''my-receipts'')).toBe(false)
diff --git a/src/lib/permissions.ts b/src/lib/permissions.ts
index b460c86..0b46495 100644
--- a/src/lib/permissions.ts
+++ b/src/lib/permissions.ts
@@ -23,6 +23,7 @@ export type PageId =
   | ''legal-notices''
   | ''settings''
   | ''subscription''
+  | ''billing-admin''
   | ''blacklist''
   | ''defaulter-list''
   | ''help''
@@ -86,7 +87,7 @@ const OWNER_PAGES: PageId[] = [
   ''dashboard'', ''buildings'', ''units'', ''vacancy'', ''tenants'', ''lease-manager'',
   ''payments'', ''balance-tracker'', ''deposits'', ''utilities'', ''reminders'',
   ''maintenance'', ''reports'', ''documents'', ''legal-notices'', ''settings'',
-  ''subscription'', ''blacklist'', ''defaulter-list'', ''help'', ''guided'', ''assistant'',
+  ''subscription'', ''billing-admin'', ''blacklist'', ''defaulter-list'', ''help'', ''guided'', ''assistant'',
   ''data-import'', ''messages'', ''receipt-view'',
 ]
 
@@ -106,7 +107,7 @@ const ROLE_PAGE_MAP: Record<Role, PageId[]> = {
 }
 
 export const TENANT_BLOCKED_PAGES: string[] = [
-  ''subscription'', ''data-import'', ''buildings'', ''units'', ''tenants'', ''reports'',
+  ''subscription'', ''billing-admin'', ''data-import'', ''buildings'', ''units'', ''tenants'', ''reports'',
   ''dashboard'', ''payments'', ''balance-tracker'', ''deposits'', ''vacancy'', ''lease-manager'',
   ''utilities'', ''reminders'', ''maintenance'', ''documents'', ''legal-notices'', ''settings'',
   ''blacklist'', ''defaulter-list'', ''messages'',
diff --git a/src/lib/subscriptionAdminSync.test.ts b/src/lib/subscriptionAdminSync.test.ts
new file mode 100644
index 0000000..c82923e
--- /dev/null
+++ b/src/lib/subscriptionAdminSync.test.ts
@@ -0,0 +1,47 @@
+import { describe, expect, it } from ''vitest''
+import {
+  claimSummaryLine,
+  countPendingClaims,
+  filterClaimsByStatus,
+  subscriptionFromApprovedClaim,
+} from ''./subscriptionAdminSync''
+import type { BillingClaim } from ''./billingAdmin''
+
+const sample: BillingClaim = {
+  id: ''claim-1'',
+  customerEmail: ''owner@example.com'',
+  customerName: ''Owner'',
+  planId: ''growth'',
+  billingCycle: ''monthly'',
+  amount: 49000,
+  momoReference: ''NYUMBA-GROWTH-ABC'',
+  status: ''pending_verification'',
+  submittedAt: ''2026-07-11T10:00:00.000Z'',
+}
+
+describe(''subscriptionAdminSync'', () => {
+  it(''builds active subscription from approved claim'', () => {
+    const approved = { ...sample, status: ''approved'' }
+    const sub = subscriptionFromApprovedClaim(approved)
+    expect(sub.status).toBe(''active'')
+    expect(sub.planId).toBe(''growth'')
+    expect(sub.momoReference).toBe(''NYUMBA-GROWTH-ABC'')
+    expect(sub.endDate).toBeTruthy()
+  })
+
+  it(''filters and counts pending claims'', () => {
+    const rows = [
+      sample,
+      { ...sample, momoReference: ''REF2'', status: ''approved'' },
+      { ...sample, momoReference: ''REF3'', status: ''rejected'' },
+    ]
+    expect(countPendingClaims(rows)).toBe(1)
+    expect(filterClaimsByStatus(rows, ''approved'')).toHaveLength(1)
+    expect(filterClaimsByStatus(rows, ''all'')).toHaveLength(3)
+  })
+
+  it(''formats claim summary'', () => {
+    expect(claimSummaryLine(sample)).toContain(''owner@example.com'')
+    expect(claimSummaryLine(sample)).toContain(''growth'')
+  })
+})
diff --git a/src/lib/subscriptionAdminSync.ts b/src/lib/subscriptionAdminSync.ts
new file mode 100644
index 0000000..e0057f7
--- /dev/null
+++ b/src/lib/subscriptionAdminSync.ts
@@ -0,0 +1,32 @@
+import type { BillingClaim } from ''./billingAdmin''
+
+/** Map approved cloud claim to local subscription activation payload */
+export const subscriptionFromApprovedClaim = (claim: BillingClaim) => {
+  const start = new Date()
+  const end = new Date(start)
+  if (claim.billingCycle === ''yearly'') {
+    end.setFullYear(end.getFullYear() + 1)
+  } else {
+    end.setMonth(end.getMonth() + 1)
+  }
+  return {
+    status: ''active'' as const,
+    planId: claim.planId,
+    billingCycle: claim.billingCycle,
+    amount: claim.amount,
+    momoReference: claim.momoReference,
+    startDate: start.toISOString().slice(0, 10),
+    endDate: end.toISOString().slice(0, 10),
+    activatedAt: new Date().toISOString(),
+    activatedBy: ''billing_admin'',
+  }
+}
+
+export const claimSummaryLine = (claim: BillingClaim) =>
+  `${claim.customerEmail} · ${claim.planId} · ${claim.momoReference} · UGX ${claim.amount.toLocaleString()}`
+
+export const filterClaimsByStatus = (claims: BillingClaim[], status: string) =>
+  status === ''all'' ? claims : claims.filter((c) => c.status === status)
+
+export const countPendingClaims = (claims: BillingClaim[]) =>
+  claims.filter((c) => c.status === ''pending_verification'').length
diff --git a/src/lib/subscriptionApiHelpers.test.ts b/src/lib/subscriptionApiHelpers.test.ts
new file mode 100644
index 0000000..0941f79
--- /dev/null
+++ b/src/lib/subscriptionApiHelpers.test.ts
@@ -0,0 +1,78 @@
+import { describe, expect, it } from ''vitest''
+import {
+  applyReview,
+  parseReviewBody,
+  sortClaimsNewestFirst,
+  validateClaimPayload,
+} from ''./subscriptionApiHelpers''
+
+describe(''subscriptionApiHelpers'', () => {
+  it(''parses review body'', () => {
+    expect(parseReviewBody({ action: ''approve'', momoReference: ''ABC123'' })).toEqual({
+      action: ''approve'',
+      momoReference: ''ABC123'',
+      note: '''',
+    })
+    expect(parseReviewBody({ action: ''nope'', momoReference: ''x'' }).action).toBe('''')
+  })
+
+  it(''applies approve and reject reviews'', () => {
+    const base = {
+      id: ''c1'',
+      customerEmail: ''a@b.com'',
+      customerName: ''A'',
+      planId: ''starter'',
+      billingCycle: ''monthly'',
+      amount: 1000,
+      momoReference: ''REF1'',
+      status: ''pending_verification'',
+      submittedAt: ''2026-07-11T00:00:00Z'',
+    }
+    const approved = applyReview(base, ''approve'', '''')
+    expect(approved.status).toBe(''approved'')
+    expect(approved.reviewedAt).toBeTruthy()
+    const rejected = applyReview(base, ''reject'', ''duplicate payment'')
+    expect(rejected.status).toBe(''rejected'')
+    expect(rejected.reviewNote).toBe(''duplicate payment'')
+  })
+
+  it(''sorts claims newest first'', () => {
+    const rows = sortClaimsNewestFirst([
+      {
+        id: ''1'',
+        customerEmail: ''a'',
+        customerName: ''A'',
+        planId: ''p'',
+        billingCycle: ''m'',
+        amount: 1,
+        momoReference: ''R1'',
+        status: ''pending_verification'',
+        submittedAt: ''2026-07-10T00:00:00Z'',
+      },
+      {
+        id: ''2'',
+        customerEmail: ''b'',
+        customerName: ''B'',
+        planId: ''p'',
+        billingCycle: ''m'',
+        amount: 1,
+        momoReference: ''R2'',
+        status: ''pending_verification'',
+        submittedAt: ''2026-07-11T00:00:00Z'',
+      },
+    ])
+    expect(rows[0].momoReference).toBe(''R2'')
+  })
+
+  it(''validates claim payload'', () => {
+    expect(
+      validateClaimPayload({
+        customerEmail: ''x@y.com'',
+        momoReference: ''NYUMBA123'',
+        planId: ''growth'',
+        amount: 49000,
+      }).ok,
+    ).toBe(true)
+    expect(validateClaimPayload({ customerEmail: '''', momoReference: ''x'' }).ok).toBe(false)
+  })
+})
diff --git a/src/lib/subscriptionApiHelpers.ts b/src/lib/subscriptionApiHelpers.ts
new file mode 100644
index 0000000..009d676
--- /dev/null
+++ b/src/lib/subscriptionApiHelpers.ts
@@ -0,0 +1,44 @@
+export type StoredClaim = {
+  id: string
+  customerEmail: string
+  customerName: string
+  planId: string
+  billingCycle: string
+  amount: number
+  momoReference: string
+  status: string
+  submittedAt: string
+  reviewedAt?: string
+  reviewNote?: string
+}
+
+export const parseReviewBody = (body: Record<string, unknown>) => {
+  const action = body.action === ''reject'' ? ''reject'' : body.action === ''approve'' ? ''approve'' : ''''
+  const momoReference = String(body.momoReference || '''').trim()
+  const note = String(body.note || '''').trim()
+  return { action, momoReference, note }
+}
+
+export const applyReview = (
+  existing: StoredClaim,
+  action: ''approve'' | ''reject'',
+  note: string,
+): StoredClaim => ({
+  ...existing,
+  status: action === ''approve'' ? ''approved'' : ''rejected'',
+  reviewedAt: new Date().toISOString(),
+  reviewNote: note || undefined,
+})
+
+export const sortClaimsNewestFirst = (claims: StoredClaim[]) =>
+  [...claims].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))
+
+export const validateClaimPayload = (body: Record<string, unknown>) => {
+  const customerEmail = String(body.customerEmail || '''').trim().toLowerCase()
+  const momoReference = String(body.momoReference || '''').trim()
+  const planId = String(body.planId || '''').trim()
+  const billingCycle = String(body.billingCycle || ''monthly'').trim()
+  const amount = Number(body.amount || 0)
+  const ok = Boolean(customerEmail && momoReference && momoReference.length >= 6 && planId && amount)
+  return { ok, customerEmail, momoReference, planId, billingCycle, amount }
+}
diff --git a/src/pages/AdminPages.jsx b/src/pages/AdminPages.jsx
index fbf0a44..49b3347 100644
--- a/src/pages/AdminPages.jsx
+++ b/src/pages/AdminPages.jsx
@@ -13,6 +13,7 @@ import { safeSet } from ''../utils/storage''
 import InviteStaffPanel from ''../components/InviteStaffPanel''
 import { canManagePortfolio } from ''../lib/permissions''
 import { MORE_TOOLS_LINKS } from ''../lib/navigation''
+import { isBillingAdminEmail } from ''../lib/billingAdmin''
 import { Badge, EmptyState, LoadingButton, StatCard } from ''../components/UI''
 
 import { inputCls, btnPrimary, btnSecondary } from ''../lib/formStyles''
@@ -626,7 +627,7 @@ Date: ${fmtDate(new Date())}` : ''''
   )
 }
 
-export function SettingsPage({ settings, setSettings, showToast, onRestartTour, activeOwnerId, currentRole, setCurrentPage }) {
+export function SettingsPage({ settings, setSettings, showToast, onRestartTour, activeOwnerId, currentRole, setCurrentPage, authUser }) {
   const [connectionStatus, setConnectionStatus] = useState(null)
   const [testing, setTesting] = useState(false)
 
@@ -662,6 +663,10 @@ export function SettingsPage({ settings, setSettings, showToast, onRestartTour,
     showToast(''Onboarding tour will show on next navigation'', ''success'')
   }
 
+  const moreTools = MORE_TOOLS_LINKS.filter(
+    (tool) => tool.id !== ''billing-admin'' || isBillingAdminEmail(authUser?.email),
+  )
+
   return (
     <div className="p-4 space-y-6 max-w-3xl">
       <h1 className="text-2xl font-bold">Settings</h1>
@@ -673,7 +678,7 @@ export function SettingsPage({ settings, setSettings, showToast, onRestartTour,
             Advanced features — billing, import, guided workflows, and more.
           </p>
           <div className="grid sm:grid-cols-2 gap-2">
-            {MORE_TOOLS_LINKS.map((tool) => (
+            {moreTools.map((tool) => (
               <button
                 key={tool.id}
                 type="button"
diff --git a/src/pages/BillingAdminPage.jsx b/src/pages/BillingAdminPage.jsx
new file mode 100644
index 0000000..625eddb
--- /dev/null
+++ b/src/pages/BillingAdminPage.jsx
@@ -0,0 +1,211 @@
+import React, { useCallback, useEffect, useState } from ''react''
+import { CheckCircle, Copy, RefreshCw, Shield, XCircle } from ''lucide-react''
+import { fmtUGX, fmtDate } from ''../utils/helpers''
+import { getPlanById } from ''../data/subscriptionPlans''
+import {
+  BILLING_ADMIN_SECRET_KEY,
+  fetchPendingClaims,
+  reviewClaim,
+} from ''../lib/billingAdmin''
+import { countPendingClaims, filterClaimsByStatus, claimSummaryLine } from ''../lib/subscriptionAdminSync''
+import { inputCls, btnPrimary, btnSecondary } from ''../lib/formStyles''
+import { Badge, LoadingButton } from ''../components/UI''
+
+const statusColor = (status) => {
+  if (status === ''approved'') return ''green''
+  if (status === ''rejected'') return ''red''
+  return ''orange''
+}
+
+export default function BillingAdminPage({ showToast, authUser }) {
+  const [secret, setSecret] = useState(() => sessionStorage.getItem(BILLING_ADMIN_SECRET_KEY) || '''')
+  const [claims, setClaims] = useState([])
+  const [loading, setLoading] = useState(false)
+  const [actionId, setActionId] = useState('''')
+  const [filter, setFilter] = useState(''pending_verification'')
+
+  const loadClaims = useCallback(async () => {
+    if (!secret.trim()) return
+    setLoading(true)
+    try {
+      const rows = await fetchPendingClaims(secret.trim())
+      setClaims(rows)
+      sessionStorage.setItem(BILLING_ADMIN_SECRET_KEY, secret.trim())
+    } catch (err) {
+      showToast(err.message || ''Could not load claims'', ''error'')
+    } finally {
+      setLoading(false)
+    }
+  }, [secret, showToast])
+
+  useEffect(() => {
+    if (secret.trim().length >= 8) loadClaims()
+  }, []) // eslint-disable-line react-hooks/exhaustive-deps
+
+  const handleReview = async (claim, action) => {
+    const note =
+      action === ''reject''
+        ? window.prompt(''Rejection note (optional):'', '''') || ''''
+        : ''''
+    setActionId(claim.momoReference)
+    try {
+      const updated = await reviewClaim(secret.trim(), claim.momoReference, action, note)
+      setClaims((rows) => rows.map((r) => (r.momoReference === updated.momoReference ? updated : r)))
+      showToast(
+        action === ''approve''
+          ? `Approved ${claim.customerEmail} — notify them to refresh the app`
+          : `Rejected ${claim.momoReference}`,
+        action === ''approve'' ? ''success'' : ''warning'',
+      )
+    } catch (err) {
+      showToast(err.message || ''Review failed'', ''error'')
+    } finally {
+      setActionId('''')
+    }
+  }
+
+  const copyClaim = async (claim) => {
+    try {
+      await navigator.clipboard.writeText(claimSummaryLine(claim))
+      showToast(''Claim copied'', ''success'')
+    } catch {
+      showToast(''Copy failed'', ''error'')
+    }
+  }
+
+  const visible = filterClaimsByStatus(claims, filter)
+  const pendingCount = countPendingClaims(claims)
+
+  return (
+    <div className="p-4 space-y-6 max-w-5xl">
+      <div className="flex flex-wrap items-start justify-between gap-3">
+        <div>
+          <h1 className="text-2xl font-bold flex items-center gap-2">
+            <Shield className="text-[#2d6a4f]" size={28} />
+            Billing admin
+          </h1>
+          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
+            Verify MoMo payments and activate subscriptions. Signed in as {authUser?.email}.
+          </p>
+        </div>
+        <Badge color="purple">PC operator panel</Badge>
+      </div>
+
+      <div className="card p-4 space-y-3">
+        <h2 className="font-semibold">Admin API secret</h2>
+        <p className="text-sm text-gray-500 dark:text-gray-400">
+          Paste the <code className="text-xs">BILLING_ADMIN_SECRET</code> from Vercel Production env
+          (same value used for <code className="text-xs">SETUP-BILLING-ADMIN.ps1</code>).
+        </p>
+        <div className="flex flex-wrap gap-2">
+          <input
+            type="password"
+            className={`${inputCls} max-w-md flex-1`}
+            placeholder="Bearer secret"
+            value={secret}
+            onChange={(e) => setSecret(e.target.value)}
+          />
+          <LoadingButton loading={loading} onClick={loadClaims} className={btnPrimary}>
+            <RefreshCw size={16} className="inline mr-1" />
+            Load claims
+          </LoadingButton>
+        </div>
+      </div>
+
+      <div className="flex flex-wrap gap-2 items-center">
+        <span className="text-sm font-medium">Show:</span>
+        {[''pending_verification'', ''approved'', ''rejected'', ''all''].map((key) => (
+          <button
+            key={key}
+            type="button"
+            onClick={() => setFilter(key)}
+            className={`px-3 py-1 rounded text-sm border ${
+              filter === key
+                ? ''bg-[#2d6a4f] text-white border-[#2d6a4f]''
+                : ''border-gray-300 dark:border-gray-600''
+            }`}
+          >
+            {key.replace(''_'', '' '')}
+          </button>
+        ))}
+        <span className="text-sm text-gray-500 ml-auto">
+          {visible.length} shown · {pendingCount} pending
+        </span>
+      </div>
+
+      {visible.length === 0 ? (
+        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
+          {secret.trim() ? ''No claims in this filter.'' : ''Enter admin secret and load claims.''}
+        </div>
+      ) : (
+        <div className="space-y-3">
+          {visible.map((claim) => {
+            const plan = getPlanById(claim.planId)
+            const pending = claim.status === ''pending_verification''
+            return (
+              <div key={claim.momoReference} className="card p-4 space-y-3">
+                <div className="flex flex-wrap justify-between gap-2">
+                  <div>
+                    <p className="font-semibold">{claim.customerName}</p>
+                    <p className="text-sm text-gray-500">{claim.customerEmail}</p>
+                  </div>
+                  <Badge color={statusColor(claim.status)}>{claim.status.replace(''_'', '' '')}</Badge>
+                </div>
+                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
+                  <div>
+                    <p className="text-gray-500">Plan</p>
+                    <p className="font-medium">{plan?.name || claim.planId}</p>
+                  </div>
+                  <div>
+                    <p className="text-gray-500">Amount</p>
+                    <p className="font-medium">{fmtUGX(claim.amount)}</p>
+                  </div>
+                  <div>
+                    <p className="text-gray-500">MoMo ref</p>
+                    <p className="font-mono text-xs break-all">{claim.momoReference}</p>
+                  </div>
+                  <div>
+                    <p className="text-gray-500">Submitted</p>
+                    <p>{fmtDate(claim.submittedAt)}</p>
+                  </div>
+                </div>
+                {claim.reviewNote ? (
+                  <p className="text-sm text-gray-600 dark:text-gray-300">Note: {claim.reviewNote}</p>
+                ) : null}
+                {pending ? (
+                  <div className="flex flex-wrap gap-2 pt-1">
+                    <LoadingButton
+                      loading={actionId === claim.momoReference}
+                      onClick={() => handleReview(claim, ''approve'')}
+                      className={`${btnPrimary} flex items-center gap-1`}
+                    >
+                      <CheckCircle size={16} />
+                      Approve MoMo
+                    </LoadingButton>
+                    <button
+                      type="button"
+                      disabled={actionId === claim.momoReference}
+                      onClick={() => handleReview(claim, ''reject'')}
+                      className={`${btnSecondary} flex items-center gap-1 text-red-700 dark:text-red-300`}
+                    >
+                      <XCircle size={16} />
+                      Reject
+                    </button>
+                    <button
+                      type="button"
+                      onClick={() => copyClaim(claim)}
+                      className={`${btnSecondary} flex items-center gap-1`}
+                    >
+                      <Copy size={16} />
+                      Copy line
+                    </button>
+                  </div>
+                ) : null}
+              </div>
+            )
+          })}
+        </div>
+      )}
+    </div>
+  )
+}
diff --git a/src/pages/SubscriptionPage.jsx b/src/pages/SubscriptionPage.jsx
index d4ba6af..f0895b6 100644
--- a/src/pages/SubscriptionPage.jsx
+++ b/src/pages/SubscriptionPage.jsx
@@ -318,11 +318,15 @@ export default function SubscriptionPage({
       )}
 
       {subscription.status === ''pending_verification'' && (
-        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
+        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 space-y-2">
           <p className="font-medium text-orange-800 dark:text-orange-200">
             Your MoMo payment is <strong>pending verification</strong>. An admin will confirm payment to{'' ''}
             {ADMIN_MOMO_DISPLAY} and activate your plan. You will receive an invoice by email once approved.
           </p>
+          <p className="text-sm text-orange-700 dark:text-orange-300">
+            Typical review time: same business day. Keep your transaction reference{'' ''}
+            <strong>{subscription.momoReference || momoReference || ''on your MoMo SMS''}</strong> handy.
+          </p>
         </div>
       )}
 

'@

$patchBytes = [System.Text.Encoding]::UTF8.GetBytes($embeddedPatch)
Write-Host "Patch size: $($patchBytes.Length) bytes" -ForegroundColor Green

Write-Host "Fetching origin/main..." -ForegroundColor Yellow
git fetch origin main
git checkout -B $Branch origin/main

$patchFile = Join-Path $PSScriptRoot "BILLING-ADMIN-ONLY.patch"
[System.IO.File]::WriteAllText($patchFile, $embeddedPatch, [System.Text.UTF8Encoding]::new($false))

git apply --whitespace=fix $patchFile
if ($LASTEXITCODE -ne 0) {
  Write-Host "git apply failed — aborting." -ForegroundColor Red
  exit 1
}

git add -A
git commit -m $CommitMsg
git push -u origin $Branch --force-with-lease

Write-Host ""
Write-Host "push succeeded" -ForegroundColor Green
Write-Host "PR: https://github.com/kakaireerick-code/NyumbaTrack/compare/main...$Branch" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify:" -ForegroundColor Yellow
Write-Host "  git fetch origin"
Write-Host "  git log origin/main..origin/$Branch --oneline"
