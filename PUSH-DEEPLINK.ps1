# NyumbaTrack PUSH-DEEPLINK.ps1
# Embeds DEEPLINK-ONLY.patch — save to C:\Users\Erik\Documents\NyumbaTrack\
# Branch: cursor/billing-admin-deeplink-5791

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$Branch = "cursor/billing-admin-deeplink-5791"
$CommitMsg = "Add /billing-admin deep link and fix API helper import"

Write-Host ""
Write-Host "PUSH-DEEPLINK" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""

git fetch origin main 2>$null
$routing = git show "origin/main:src/lib/routing.ts" 2>$null
if ($LASTEXITCODE -eq 0 -and $routing -match "billing-admin") {
  Write-Host "SKIP — /billing-admin deep link already on main (PR #32 merged)." -ForegroundColor Green
  Write-Host "Open: https://nyumbatracker.vercel.app/billing-admin" -ForegroundColor Cyan
  exit 0
}

$url = git remote get-url origin 2>$null
if ($url -match "ultt|land-tax" -and $url -notmatch "Nyumba|nyumba") {
  Write-Host "Fixing wrong origin: $url" -ForegroundColor Yellow
  git remote set-url origin $RepoHttps
}

$embeddedPatch = @'
diff --git a/api/subscription.ts b/api/subscription.ts
index 0e97ea3..2c7f7f4 100644
--- a/api/subscription.ts
+++ b/api/subscription.ts
@@ -6,7 +6,7 @@ import {
   sortClaimsNewestFirst,
   validateClaimPayload,
   type StoredClaim,
-} from ''../src/lib/subscriptionApiHelpers''
+} from ''../src/lib/subscriptionApiHelpers.js''
 
 type ClaimBody = {
   customerEmail?: string
diff --git a/scripts/verify-features.mjs b/scripts/verify-features.mjs
index c78b89a..56aa9f4 100644
--- a/scripts/verify-features.mjs
+++ b/scripts/verify-features.mjs
@@ -126,13 +126,15 @@ confirm(
 // F15 Billing admin panel
 const billingAdminPage = exists(''src/pages/BillingAdminPage.jsx'') ? read(''src/pages/BillingAdminPage.jsx'') : ''''
 const subApi = exists(''api/subscription.ts'') ? read(''api/subscription.ts'') : ''''
+const routing = exists(''src/lib/routing.ts'') ? read(''src/lib/routing.ts'') : ''''
 confirm(
   ''F15'',
   ''Billing admin panel'',
   billingAdminPage.includes(''Billing admin'') &&
     subApi.includes("req.method === ''PATCH''") &&
-    exists(''src/lib/billingAdmin.ts''),
-  ''BillingAdminPage + MoMo approval API'',
+    exists(''src/lib/billingAdmin.ts'') &&
+    routing.includes("''billing-admin''"),
+  ''BillingAdminPage + MoMo approval API + /billing-admin route'',
 )
 
 const failed = checks.filter((c) => !c.ok)
diff --git a/src/App.jsx b/src/App.jsx
index 69795d0..deba65d 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -56,7 +56,7 @@ import { getTourSteps, isTourComplete } from ''./lib/rolePrompts''
 import { DEMO_BUILDINGS, DEMO_UNITS, DEMO_TENANTS } from ''./lib/demoData''
 import { getOwnerIdForUser, filterByOwner, DEMO_OWNER_ID } from ''./lib/scope''
 import { syncInvitesFromUnits } from ''./lib/invites''
-import { parseEntryPath, getTenantJoinPath, getCaretakerJoinPath, getReceiptPath } from ''./lib/routing''
+import { parseEntryPath, getTenantJoinPath, getCaretakerJoinPath, getReceiptPath, getBillingAdminPath } from ''./lib/routing''
 import { getCaretakerSafeBuilding, getCaretakerSafeUnit, getCaretakerSafeTenant } from ''./lib/propertyViews''
 import NotificationInbox from ''./components/NotificationInbox''
 import { addNotification } from ''./lib/notifications''
@@ -206,6 +206,18 @@ function AppContent() {
     }
   }, [isLoggedIn, entryPath.kind, entryPath.receiptId])
 
+  useEffect(() => {
+    if (!isLoggedIn || entryPath.kind !== ''billing-admin'') return
+    if (isBillingAdminEmail(authUser?.email)) {
+      setCurrentPage(''billing-admin'')
+      window.history.replaceState({}, '''', getBillingAdminPath())
+    } else {
+      showToast(''Billing admin is restricted to the platform operator email.'', ''error'')
+      setCurrentPage(defaultPageForRole(normalizeRole(currentRole)))
+      window.history.replaceState({}, '''', ''/login'')
+    }
+  }, [isLoggedIn, entryPath.kind, authUser?.email, currentRole, showToast])
+
   const openReceiptRoute = useCallback((receiptId) => {
     if (!receiptId) return
     window.history.pushState({}, '''', getReceiptPath(receiptId))
@@ -409,7 +421,12 @@ function AppContent() {
         return prev
       })
     }
-    setCurrentPage(ROLE_DEFAULT_PAGE[role] || defaultPageForRole(role))
+    if (entryPath.kind === ''billing-admin'' && isBillingAdminEmail(user.email)) {
+      setCurrentPage(''billing-admin'')
+      window.history.replaceState({}, '''', getBillingAdminPath())
+    } else {
+      setCurrentPage(ROLE_DEFAULT_PAGE[role] || defaultPageForRole(role))
+    }
     if (!isTourComplete(role)) setShowTour(true)
     showToast(startedTrial ? ''Welcome! Your 14-day free trial has started.'' : `Welcome, ${name}!`, ''success'')
   }
diff --git a/src/lib/routing.test.ts b/src/lib/routing.test.ts
index 56ce686..c2a53e1 100644
--- a/src/lib/routing.test.ts
+++ b/src/lib/routing.test.ts
@@ -14,6 +14,11 @@ describe(''routing'', () => {
     expect(entry.inviteCode).toBe(''CTR-7F2G'')
   })
 
+  it(''parses billing admin deep link'', () => {
+    expect(parseEntryPath(''/billing-admin'').kind).toBe(''billing-admin'')
+    expect(parseEntryPath(''/billing-admin/'').kind).toBe(''billing-admin'')
+  })
+
   it(''parses owner login routes'', () => {
     expect(parseEntryPath(''/login'').kind).toBe(''owner-login'')
     expect(parseEntryPath(''/owner'').kind).toBe(''owner-login'')
diff --git a/src/lib/routing.ts b/src/lib/routing.ts
index afbd6d6..81d147d 100644
--- a/src/lib/routing.ts
+++ b/src/lib/routing.ts
@@ -2,7 +2,7 @@
 
 import type { Role } from ''./permissions''
 
-export type EntryKind = ''owner-login'' | ''owner-signup'' | ''join-tenant'' | ''join-caretaker'' | ''receipt''
+export type EntryKind = ''owner-login'' | ''owner-signup'' | ''join-tenant'' | ''join-caretaker'' | ''receipt'' | ''billing-admin''
 
 export type AppEntry = {
   kind: EntryKind
@@ -45,6 +45,10 @@ export const parseEntryPath = (pathname = window.location.pathname): AppEntry =>
     return { kind: ''owner-signup'', inviteCode: '''', receiptId: '''' }
   }
 
+  if (path === ''/billing-admin'') {
+    return { kind: ''billing-admin'', inviteCode: '''', receiptId: '''' }
+  }
+
   if (path === ''/login'' || path === ''/owner'' || path === ''/'') {
     return { kind: ''owner-login'', inviteCode: '''', receiptId: '''' }
   }
@@ -78,6 +82,8 @@ export const getOwnerLoginPath = (): string => ''/login''
 
 export const getOwnerSignupPath = (): string => ''/owner/signup''
 
+export const getBillingAdminPath = (): string => ''/billing-admin''
+
 export const getReceiptPath = (receiptId: string): string =>
   `/receipt/${encodeURIComponent(receiptId)}`
 

'@

$patchBytes = [System.Text.Encoding]::UTF8.GetBytes($embeddedPatch)
Write-Host "Patch size: $($patchBytes.Length) bytes" -ForegroundColor Green

Write-Host "Fetching origin/main..." -ForegroundColor Yellow
git fetch origin main
git checkout -B $Branch origin/main

$patchFile = Join-Path $PSScriptRoot "DEEPLINK-ONLY.patch"
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
Write-Host "After merge + deploy, open:" -ForegroundColor Yellow
Write-Host "  https://nyumbatracker.vercel.app/billing-admin"
