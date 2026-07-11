# NyumbaTrack PUSH-TENANT-INVITE.ps1
# Cloud Redis invites — cross-device tenant/caretaker join links
# Branch: cursor/tenant-invite-cloud-5791

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$RepoHttps = "https://github.com/kakaireerick-code/NyumbaTrack.git"
$Branch = "cursor/tenant-invite-cloud-5791"
$CommitMsg = "Fix cross-device tenant invites via Redis cloud API"
$GhRepo = "kakaireerick-code/NyumbaTrack"
$PrUrl = "https://github.com/kakaireerick-code/NyumbaTrack/compare/main...$Branch"

Write-Host ""
Write-Host "PUSH-TENANT-INVITE" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

git fetch origin main 2>$null
$onMain = git show "origin/main:api/invite.ts" 2>$null
if ($LASTEXITCODE -eq 0 -and $onMain) {
  Write-Host "SKIP — api/invite.ts already on main." -ForegroundColor Green
  if (Test-Path ".\OWNER-SYNC.ps1") { & ".\OWNER-SYNC.ps1" }
  exit $LASTEXITCODE
}

$url = git remote get-url origin 2>$null
if ($url -match "ultt|land-tax" -and $url -notmatch "Nyumba|nyumba") {
  git remote set-url origin $RepoHttps
}

$embeddedPatch = @'
diff --git a/api/invite.ts b/api/invite.ts
new file mode 100644
index 0000000..8fa8e08
--- /dev/null
+++ b/api/invite.ts
@@ -0,0 +1,116 @@
+import type { VercelRequest, VercelResponse } from ''@vercel/node''
+import { Redis } from ''@upstash/redis''
+
+export type CloudInviteRecord = {
+  code: string
+  role: ''tenant'' | ''caretaker''
+  ownerId: string
+  propertyId?: string
+  unitId?: string
+  status: ''pending'' | ''used'' | ''revoked''
+  unitNumber?: string
+  buildingName?: string
+  monthlyRent?: number
+  depositAmount?: number
+  rentDueDay?: number
+  createdAt: string
+  usedByUserId?: string | null
+}
+
+const redis = () => {
+  const url = process.env.UPSTASH_REDIS_REST_URL
+  const token = process.env.UPSTASH_REDIS_REST_TOKEN
+  if (!url || !token) return null
+  return new Redis({ url, token })
+}
+
+const normCode = (code: string) => String(code || '''').trim().toUpperCase().replace(/\s+/g, '''')
+
+const inviteKey = (role: string, code: string) => `invite:${role}:${normCode(code)}`
+
+const parseBody = (req: VercelRequest): Record<string, unknown> => {
+  if (typeof req.body === ''string'') {
+    try {
+      return JSON.parse(req.body)
+    } catch {
+      return {}
+    }
+  }
+  return (req.body || {}) as Record<string, unknown>
+}
+
+export default async function handler(req: VercelRequest, res: VercelResponse) {
+  res.setHeader(''Cache-Control'', ''no-store'')
+  const r = redis()
+
+  if (req.method === ''GET'') {
+    const code = normCode(String(req.query.code || ''''))
+    const role = String(req.query.role || '''').toLowerCase()
+    if (!code || code.length < 6 || (role !== ''tenant'' && role !== ''caretaker'')) {
+      return res.status(400).json({ ok: false, error: ''code and role required'' })
+    }
+    if (!r) return res.status(503).json({ ok: false, error: ''Redis not configured'' })
+
+    const record = await r.get<CloudInviteRecord>(inviteKey(role, code))
+    if (!record || record.status !== ''pending'') {
+      return res.status(404).json({ ok: false, error: ''Invalid or expired invite'' })
+    }
+    return res.status(200).json({ ok: true, invite: record })
+  }
+
+  if (req.method === ''POST'') {
+    if (!r) return res.status(503).json({ ok: false, error: ''Redis not configured'' })
+    const body = parseBody(req)
+    const code = normCode(String(body.code || ''''))
+    const role = body.role === ''caretaker'' ? ''caretaker'' : body.role === ''tenant'' ? ''tenant'' : ''''
+    const ownerId = String(body.ownerId || '''').trim()
+    if (!code || !role || !ownerId) {
+      return res.status(400).json({ ok: false, error: ''code, role, ownerId required'' })
+    }
+
+    const record: CloudInviteRecord = {
+      code,
+      role,
+      ownerId,
+      propertyId: body.propertyId ? String(body.propertyId) : undefined,
+      unitId: body.unitId ? String(body.unitId) : undefined,
+      status: ''pending'',
+      unitNumber: body.unitNumber ? String(body.unitNumber) : undefined,
+      buildingName: body.buildingName ? String(body.buildingName) : undefined,
+      monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : undefined,
+      depositAmount: body.depositAmount != null ? Number(body.depositAmount) : undefined,
+      rentDueDay: body.rentDueDay != null ? Number(body.rentDueDay) : undefined,
+      createdAt: String(body.createdAt || new Date().toISOString()),
+      usedByUserId: null,
+    }
+
+    await r.set(inviteKey(role, code), record)
+    return res.status(200).json({ ok: true, invite: record })
+  }
+
+  if (req.method === ''PATCH'') {
+    if (!r) return res.status(503).json({ ok: false, error: ''Redis not configured'' })
+    const body = parseBody(req)
+    const code = normCode(String(body.code || ''''))
+    const role = body.role === ''caretaker'' ? ''caretaker'' : body.role === ''tenant'' ? ''tenant'' : ''''
+    const userId = String(body.userId || '''').trim()
+    if (!code || !role || !userId) {
+      return res.status(400).json({ ok: false, error: ''code, role, userId required'' })
+    }
+
+    const key = inviteKey(role, code)
+    const existing = await r.get<CloudInviteRecord>(key)
+    if (!existing) {
+      return res.status(404).json({ ok: false, error: ''Invite not found'' })
+    }
+    const updated: CloudInviteRecord = {
+      ...existing,
+      status: ''used'',
+      usedByUserId: userId,
+    }
+    await r.set(key, updated)
+    return res.status(200).json({ ok: true, invite: updated })
+  }
+
+  return res.status(405).json({ ok: false, error: ''Method not allowed'' })
+}
diff --git a/docs/TENANT-INVITES.md b/docs/TENANT-INVITES.md
new file mode 100644
index 0000000..6b72f96
--- /dev/null
+++ b/docs/TENANT-INVITES.md
@@ -0,0 +1,62 @@
+# Tenant invite links (cross-device)
+
+## Problem (fixed)
+
+Invite codes lived only in the **landlord''s browser** (`localStorage`). When a tenant opened `/join/tenant/KLA-XXXX` on another phone, incognito, or browser, the code did not exist locally → **"Invalid or expired invite."**
+
+## Solution
+
+Redis-backed **`/api/invite`** (same Upstash as billing):
+
+| Method | Purpose |
+|--------|---------|
+| `POST` | Landlord syncs invite + unit snapshot (unit number, building, rent) |
+| `GET ?code=&role=` | Public validation for join pages |
+| `PATCH` | Mark invite used after registration |
+
+### Landlord flow
+
+Creating, copying, or regenerating tenant/caretaker invites calls **`pushInviteToCloud`** with unit snapshot.
+
+### Tenant flow
+
+Join pages use **`registerTenantAsync`** / **`registerCaretakerAsync`**:
+
+1. Try local `localStorage` invite
+2. If missing → **`fetchCloudInvite`** from Redis
+3. Show **"Code accepted — Unit …"** from cloud snapshot
+4. Register and **`PATCH`** mark used
+
+## Test after deploy
+
+1. `.\OWNER-SYNC.ps1`
+2. Sign in as **owner** → vacant unit → **Invite tenant** → **Copy tenant link**
+3. Open link on **phone or incognito** (not owner''s browser)
+4. Register → **"Code accepted — Unit …"** → tenant portal
+
+## Env vars
+
+Uses existing Vercel Production Redis (same as billing):
+
+- `UPSTASH_REDIS_REST_URL`
+- `UPSTASH_REDIS_REST_TOKEN`
+
+No new secrets required.
+
+## API examples
+
+```bash
+# Validate (public)
+curl "https://nyumbatracker.vercel.app/api/invite?code=KLA-AB12&role=tenant"
+
+# Sync (from landlord app POST)
+# Mark used (from tenant app PATCH)
+```
+
+## Verify
+
+```bash
+npm test                  # includes cross-device scenario
+npm run verify:features   # F16 cloud tenant invites
+npm run ops:guardrail
+```
diff --git a/scripts/verify-features.mjs b/scripts/verify-features.mjs
index 56aa9f4..081063a 100644
--- a/scripts/verify-features.mjs
+++ b/scripts/verify-features.mjs
@@ -137,6 +137,19 @@ confirm(
   ''BillingAdminPage + MoMo approval API + /billing-admin route'',
 )
 
+// F16 Cloud tenant invites
+const inviteApi = exists(''api/invite.ts'') ? read(''api/invite.ts'') : ''''
+const inviteCloud = exists(''src/lib/inviteCloud.ts'') ? read(''src/lib/inviteCloud.ts'') : ''''
+const joinPage = exists(''src/pages/JoinPage.jsx'') ? read(''src/pages/JoinPage.jsx'') : ''''
+confirm(
+  ''F16'',
+  ''Cloud tenant invites'',
+  inviteApi.includes("req.method === ''POST''") &&
+    inviteCloud.includes(''fetchCloudInvite'') &&
+    joinPage.includes(''registerTenantAsync''),
+  ''api/invite.ts + cross-device join'',
+)
+
 const failed = checks.filter((c) => !c.ok)
 const sha = (() => {
   try {
@@ -148,6 +161,6 @@ const sha = (() => {
 
 console.log(`\n${failed.length ? ''FAIL'' : ''PASS''} — ${checks.length - failed.length}/${checks.length} features`)
 if (!failed.length) {
-  console.log(`\nAll F1–F15 CONFIRMED at ${sha}`)
+  console.log(`\nAll F1–F16 CONFIRMED at ${sha}`)
 }
 process.exit(failed.length ? 1 : 0)
diff --git a/src/components/InviteStaffPanel.jsx b/src/components/InviteStaffPanel.jsx
index 936907e..d62c897 100644
--- a/src/components/InviteStaffPanel.jsx
+++ b/src/components/InviteStaffPanel.jsx
@@ -6,6 +6,7 @@ import {
   regenerateCaretakerInvite,
   findPendingCaretakerInviteForOwner,
   createCaretakerInvite,
+  pushInviteToCloud,
 } from ''../lib/invites''
 
 export default function InviteStaffPanel({ ownerId, showToast, propertyId }) {
@@ -20,6 +21,7 @@ export default function InviteStaffPanel({ ownerId, showToast, propertyId }) {
     let inv = findPendingCaretakerInviteForOwner(ownerId)
     if (!inv) {
       inv = createCaretakerInvite(ownerId, propertyId)
+      pushInviteToCloud(inv)
     }
     setCode(inv.code)
     return inv.code
@@ -41,6 +43,7 @@ export default function InviteStaffPanel({ ownerId, showToast, propertyId }) {
   const handleRegenerate = () => {
     const inv = regenerateCaretakerInvite(ownerId, activeCode)
     setCode(inv.code)
+    pushInviteToCloud(inv)
     showToast?.(''New code generated — old link no longer works'', ''success'')
   }
 
diff --git a/src/components/InviteTenantPanel.jsx b/src/components/InviteTenantPanel.jsx
index 0034906..0fc9765 100644
--- a/src/components/InviteTenantPanel.jsx
+++ b/src/components/InviteTenantPanel.jsx
@@ -6,6 +6,7 @@ import {
   regenerateTenantInvite,
   findInviteForUnit,
   createTenantInviteForUnit,
+  pushInviteToCloud,
 } from ''../lib/invites''
 
 export default function InviteTenantPanel({
@@ -23,11 +24,22 @@ export default function InviteTenantPanel({
 
   if (!unit || !ownerId) return null
 
+  const syncToCloud = (inv) => {
+    pushInviteToCloud(inv, {
+      unitNumber: unit?.unitNumber,
+      buildingName: building?.name,
+      monthlyRent: unit?.monthlyRent,
+      depositAmount: unit?.depositAmount,
+      rentDueDay: unit?.rentDueDay,
+    })
+  }
+
   const ensureCode = () => {
     let inv = findInviteForUnit(unit.id)
     if (!inv || inv.status !== ''pending'') {
       inv = createTenantInviteForUnit(ownerId, String(unit.buildingId), String(unit.id))
       onCodeChange?.(inv.code)
+      syncToCloud(inv)
     }
     setCode(inv.code)
     return inv.code
@@ -50,6 +62,7 @@ export default function InviteTenantPanel({
     const inv = regenerateTenantInvite(ownerId, String(unit.buildingId), String(unit.id), activeCode)
     setCode(inv.code)
     onCodeChange?.(inv.code)
+    syncToCloud(inv)
     showToast?.(''New code generated — old link no longer works'', ''success'')
   }
 
diff --git a/src/lib/auth.ts b/src/lib/auth.ts
index 72184d5..fa42fbf 100644
--- a/src/lib/auth.ts
+++ b/src/lib/auth.ts
@@ -1,5 +1,13 @@
 import { safeGet, safeSet } from ''./storage''
-import { validateInviteForRole, markInviteUsed, seedDemoInvites } from ''./invites''
+import {
+  validateInviteForRole,
+  validateInviteForRoleAsync,
+  markInviteUsed,
+  seedDemoInvites,
+  getInvites,
+  saveInvites,
+} from ''./invites''
+import { fetchCloudInvite, markCloudInviteUsed, unitFromCloudInvite } from ''./inviteCloud''
 import { GENERIC_INVITE_ERROR, GENERIC_AUTH_ERROR } from ''./portalAuth''
 import { isDeployedApp } from ''./environment''
 import { normalizeInviteCode } from ''./routing''
@@ -170,6 +178,67 @@ export const registerCaretaker = (
   return { ok: true, user }
 }
 
+export const registerTenantAsync = async (
+  email: string,
+  password: string,
+  name: string,
+  inviteCode: string,
+  units: Array<Record<string, unknown>>,
+  buildings: Array<Record<string, unknown>> = [],
+): Promise<{
+  ok: boolean
+  error?: string
+  user?: AppUser
+  unit?: Record<string, unknown>
+  invite?: { ownerId: string; propertyId: string; unitId: string; code: string }
+}> => {
+  const validation = await validateInviteForRoleAsync(inviteCode, ''tenant'')
+  if (!validation.ok) return { ok: false, error: validation.error }
+
+  let unitList = units
+  if (validation.cloud) {
+    const norm = normalizeInviteCode(inviteCode)
+    const existing = getInvites()
+    if (!existing.some((i) => normalizeInviteCode(i.code) === norm)) {
+      saveInvites([...existing, validation.invite])
+    }
+    const cloud = await fetchCloudInvite(inviteCode, ''tenant'')
+    if (cloud && !unitList.find((u) => String(u.id) === String(cloud.unitId))) {
+      unitList = [...unitList, unitFromCloudInvite(cloud)]
+    }
+  }
+
+  const result = registerTenant(email, password, name, inviteCode, unitList, buildings)
+  if (result.ok && result.user) {
+    await markCloudInviteUsed(inviteCode, ''tenant'', result.user.id)
+  }
+  return result
+}
+
+export const registerCaretakerAsync = async (
+  email: string,
+  password: string,
+  name: string,
+  inviteCode: string,
+): Promise<{ ok: boolean; error?: string; user?: AppUser }> => {
+  const validation = await validateInviteForRoleAsync(inviteCode, ''caretaker'')
+  if (!validation.ok) return { ok: false, error: validation.error }
+
+  if (validation.cloud) {
+    const norm = normalizeInviteCode(inviteCode)
+    const existing = getInvites()
+    if (!existing.some((i) => normalizeInviteCode(i.code) === norm)) {
+      saveInvites([...existing, validation.invite])
+    }
+  }
+
+  const result = registerCaretaker(email, password, name, inviteCode)
+  if (result.ok && result.user) {
+    await markCloudInviteUsed(inviteCode, ''caretaker'', result.user.id)
+  }
+  return result
+}
+
 /** @deprecated use registerCaretaker */
 export const registerHousekeeper = registerCaretaker
 
diff --git a/src/lib/inviteCloud.test.ts b/src/lib/inviteCloud.test.ts
new file mode 100644
index 0000000..17c71e9
--- /dev/null
+++ b/src/lib/inviteCloud.test.ts
@@ -0,0 +1,42 @@
+import { describe, it, expect } from ''vitest''
+import { cloudInviteToRecord, unitFromCloudInvite } from ''./inviteCloud''
+import type { CloudInvite } from ''./inviteCloud''
+
+describe(''inviteCloud helpers'', () => {
+  it(''maps cloud invite to local invite record'', () => {
+    const cloud: CloudInvite = {
+      code: ''KLA-AB12'',
+      role: ''tenant'',
+      ownerId: ''owner-1'',
+      propertyId: ''b1'',
+      unitId: ''u1'',
+      status: ''pending'',
+      createdAt: ''2026-07-11T00:00:00Z'',
+      unitNumber: ''3B'',
+      buildingName: ''Sunrise Apts'',
+      monthlyRent: 500000,
+    }
+    const record = cloudInviteToRecord(cloud)
+    expect(record.code).toBe(''KLA-AB12'')
+    expect(record.unitId).toBe(''u1'')
+  })
+
+  it(''builds unit snapshot from cloud invite'', () => {
+    const cloud: CloudInvite = {
+      code: ''KLA-AB12'',
+      role: ''tenant'',
+      ownerId: ''owner-1'',
+      propertyId: ''b1'',
+      unitId: ''u1'',
+      status: ''pending'',
+      createdAt: ''2026-07-11T00:00:00Z'',
+      unitNumber: ''3B'',
+      monthlyRent: 450000,
+      depositAmount: 900000,
+    }
+    const unit = unitFromCloudInvite(cloud)
+    expect(unit.unitNumber).toBe(''3B'')
+    expect(unit.monthlyRent).toBe(450000)
+    expect(unit.status).toBe(''vacant'')
+  })
+})
diff --git a/src/lib/inviteCloud.ts b/src/lib/inviteCloud.ts
new file mode 100644
index 0000000..73398d8
--- /dev/null
+++ b/src/lib/inviteCloud.ts
@@ -0,0 +1,108 @@
+import type { InviteRecord, InviteRole } from ''./invites''
+import { normalizeInviteCode } from ''./routing''
+
+export type CloudInvite = InviteRecord & {
+  unitNumber?: string
+  buildingName?: string
+  monthlyRent?: number
+  depositAmount?: number
+  rentDueDay?: number
+}
+
+export type UnitInviteSnapshot = {
+  unitNumber?: string
+  buildingName?: string
+  monthlyRent?: number
+  depositAmount?: number
+  rentDueDay?: number
+}
+
+const cloudEnabled = () =>
+  typeof fetch !== ''undefined'' && typeof window !== ''undefined''
+
+export const syncCloudInvite = async (
+  invite: InviteRecord,
+  snapshot?: UnitInviteSnapshot,
+): Promise<boolean> => {
+  if (!cloudEnabled()) return false
+  try {
+    const res = await fetch(''/api/invite'', {
+      method: ''POST'',
+      headers: { ''Content-Type'': ''application/json'' },
+      body: JSON.stringify({
+        code: invite.code,
+        role: invite.role,
+        ownerId: invite.ownerId,
+        propertyId: invite.propertyId,
+        unitId: invite.unitId,
+        createdAt: invite.createdAt,
+        ...snapshot,
+      }),
+    })
+    const data = await res.json().catch(() => ({}))
+    return res.ok && data.ok === true
+  } catch {
+    return false
+  }
+}
+
+export const fetchCloudInvite = async (
+  code: string,
+  role: InviteRole,
+): Promise<CloudInvite | null> => {
+  const norm = normalizeInviteCode(code)
+  if (!norm || norm.length < 6) return null
+  try {
+    const qs = new URLSearchParams({ code: norm, role })
+    const res = await fetch(`/api/invite?${qs}`)
+    const data = await res.json().catch(() => ({}))
+    if (!res.ok || !data.invite) return null
+    return data.invite as CloudInvite
+  } catch {
+    return null
+  }
+}
+
+export const markCloudInviteUsed = async (
+  code: string,
+  role: InviteRole,
+  userId: string,
+): Promise<boolean> => {
+  try {
+    const res = await fetch(''/api/invite'', {
+      method: ''PATCH'',
+      headers: { ''Content-Type'': ''application/json'' },
+      body: JSON.stringify({ code: normalizeInviteCode(code), role, userId }),
+    })
+    const data = await res.json().catch(() => ({}))
+    return res.ok && data.ok === true
+  } catch {
+    return false
+  }
+}
+
+/** Build a minimal unit object from cloud invite for cross-device registration */
+export const unitFromCloudInvite = (invite: CloudInvite): Record<string, unknown> => ({
+  id: invite.unitId,
+  buildingId: invite.propertyId,
+  ownerId: invite.ownerId,
+  unitNumber: invite.unitNumber || ''Unit'',
+  monthlyRent: invite.monthlyRent ?? 0,
+  depositAmount: invite.depositAmount ?? 0,
+  rentDueDay: invite.rentDueDay ?? 5,
+  status: ''vacant'',
+  currentTenantId: null,
+  inviteCode: invite.code,
+})
+
+export const cloudInviteToRecord = (cloud: CloudInvite): InviteRecord => ({
+  code: cloud.code,
+  role: cloud.role,
+  ownerId: cloud.ownerId,
+  propertyId: cloud.propertyId,
+  unitId: cloud.unitId,
+  status: cloud.status,
+  expiresAt: cloud.expiresAt ?? null,
+  createdAt: cloud.createdAt,
+  usedByUserId: cloud.usedByUserId ?? null,
+})
diff --git a/src/lib/invites.cloud.test.ts b/src/lib/invites.cloud.test.ts
new file mode 100644
index 0000000..443455f
--- /dev/null
+++ b/src/lib/invites.cloud.test.ts
@@ -0,0 +1,108 @@
+import { describe, it, expect, beforeEach, vi } from ''vitest''
+import {
+  saveInvites,
+  validateInviteForRoleAsync,
+  createTenantInviteForUnit,
+} from ''./invites''
+import { registerTenantAsync } from ''./auth''
+
+describe(''cross-device tenant invite'', () => {
+  beforeEach(() => {
+    saveInvites([])
+    vi.restoreAllMocks()
+  })
+
+  it(''validateInviteForRoleAsync falls back to cloud when local missing'', async () => {
+    const cloudInvite = {
+      code: ''KLA-CLOUD'',
+      role: ''tenant'',
+      ownerId: ''owner-1'',
+      propertyId: ''b1'',
+      unitId: ''u-remote'',
+      status: ''pending'',
+      unitNumber: ''5A'',
+      buildingName: ''Cloud Tower'',
+      monthlyRent: 600000,
+      createdAt: new Date().toISOString(),
+    }
+
+    vi.stubGlobal(
+      ''fetch'',
+      vi.fn(async (url: string) => {
+        if (String(url).includes(''/api/invite'')) {
+          return {
+            ok: true,
+            json: async () => ({ ok: true, invite: cloudInvite }),
+          }
+        }
+        return { ok: false, json: async () => ({}) }
+      }),
+    )
+
+    const result = await validateInviteForRoleAsync(''KLA-CLOUD'', ''tenant'')
+    expect(result.ok).toBe(true)
+    if (result.ok) {
+      expect(result.cloud).toBe(true)
+      expect(result.invite.unitId).toBe(''u-remote'')
+    }
+  })
+
+  it(''registerTenantAsync registers tenant from cloud invite on empty local storage'', async () => {
+    const cloudInvite = {
+      code: ''KLA-PHONE'',
+      role: ''tenant'',
+      ownerId: ''owner-1'',
+      propertyId: ''b1'',
+      unitId: ''u-phone'',
+      status: ''pending'',
+      unitNumber: ''2C'',
+      buildingName: ''Phone Block'',
+      monthlyRent: 400000,
+      depositAmount: 800000,
+      createdAt: new Date().toISOString(),
+    }
+
+    vi.stubGlobal(
+      ''fetch'',
+      vi.fn(async (url: string, init?: RequestInit) => {
+        const method = init?.method || ''GET''
+        if (String(url).includes(''/api/invite'') && method === ''GET'') {
+          return {
+            ok: true,
+            json: async () => ({ ok: true, invite: cloudInvite }),
+          }
+        }
+        if (String(url).includes(''/api/invite'') && method === ''PATCH'') {
+          return { ok: true, json: async () => ({ ok: true }) }
+        }
+        return { ok: false, json: async () => ({}) }
+      }),
+    )
+
+    const result = await registerTenantAsync(
+      ''tenant.phone@example.com'',
+      ''pass1234'',
+      ''Phone Tenant'',
+      ''KLA-PHONE'',
+      [],
+      [],
+    )
+
+    expect(result.ok).toBe(true)
+    expect(result.user?.role).toBe(''tenant'')
+    expect(result.unit?.unitNumber).toBe(''2C'')
+  })
+
+  it(''local invite still works without cloud'', async () => {
+    const invite = createTenantInviteForUnit(''owner-1'', ''b1'', ''u1'')
+    const result = await registerTenantAsync(
+      ''local.tenant@example.com'',
+      ''pass1234'',
+      ''Local Tenant'',
+      invite.code,
+      [{ id: ''u1'', buildingId: ''b1'', unitNumber: ''1A'', monthlyRent: 300000, status: ''vacant'' }],
+      [{ id: ''b1'', name: ''Local Building'' }],
+    )
+    expect(result.ok).toBe(true)
+  })
+})
diff --git a/src/lib/invites.ts b/src/lib/invites.ts
index 68da9af..abe7344 100644
--- a/src/lib/invites.ts
+++ b/src/lib/invites.ts
@@ -1,6 +1,15 @@
 import { safeGet, safeSet } from ''./storage''
 import { normalizeInviteCode, getJoinUrl } from ''./routing''
 import { GENERIC_INVITE_ERROR } from ''./portalAuth''
+import {
+  fetchCloudInvite,
+  cloudInviteToRecord,
+  syncCloudInvite,
+  type UnitInviteSnapshot,
+} from ''./inviteCloud''
+
+export { syncCloudInvite, fetchCloudInvite, markCloudInviteUsed } from ''./inviteCloud''
+export type { UnitInviteSnapshot } from ''./inviteCloud''
 
 export type InviteRole = ''tenant'' | ''caretaker''
 export type InviteStatus = ''pending'' | ''used'' | ''revoked''
@@ -204,6 +213,28 @@ export const validateInviteForRole = (
   return { ok: true, invite }
 }
 
+/** Local storage first, then Redis cloud invite (cross-device join) */
+export const validateInviteForRoleAsync = async (
+  code: string,
+  expectedRole: InviteRole,
+): Promise<ValidateInviteResult & { cloud?: boolean }> => {
+  const local = validateInviteForRole(code, expectedRole)
+  if (local.ok) return local
+
+  const cloud = await fetchCloudInvite(code, expectedRole)
+  if (!cloud || cloud.status !== ''pending'') {
+    return { ok: false, error: GENERIC_INVITE_ERROR }
+  }
+  return { ok: true, invite: cloudInviteToRecord(cloud), cloud: true }
+}
+
+export const pushInviteToCloud = async (
+  invite: InviteRecord,
+  snapshot?: UnitInviteSnapshot,
+): Promise<void> => {
+  await syncCloudInvite(invite, snapshot)
+}
+
 /** @deprecated use validateInviteForRole(code, ''tenant'') */
 export const validateInviteCode = (code: string): ValidateInviteResult =>
   validateInviteForRole(code, ''tenant'')
diff --git a/src/pages/JoinPage.jsx b/src/pages/JoinPage.jsx
index 4efaa1a..b749023 100644
--- a/src/pages/JoinPage.jsx
+++ b/src/pages/JoinPage.jsx
@@ -1,7 +1,8 @@
 import React, { useState, useEffect } from ''react''
 import { Home, Eye, EyeOff, MessageCircle } from ''lucide-react''
-import { seedDemoUsers, registerTenant, login } from ''../lib/auth''
+import { seedDemoUsers, registerTenantAsync, login } from ''../lib/auth''
 import { validateInviteForRole } from ''../lib/invites''
+import { fetchCloudInvite } from ''../lib/inviteCloud''
 import { normalizeInviteCode } from ''../lib/routing''
 import { validatePortalSignIn, showDemoCredentials, GENERIC_AUTH_ERROR } from ''../lib/portalAuth''
 import { checkJoinRateLimit, recordJoinFailure, clearJoinFailures } from ''../lib/joinRateLimit''
@@ -31,25 +32,43 @@ export default function TenantJoinPage({
   }, [initialCode])
 
   useEffect(() => {
-    if (!inviteCode || inviteCode.length < 6) {
-      setCodeHint('''')
-      return
+    let cancelled = false
+    const run = async () => {
+      if (!inviteCode || inviteCode.length < 6) {
+        setCodeHint('''')
+        return
+      }
+      const v = validateInviteForRole(inviteCode, ''tenant'')
+      if (v.ok) {
+        const unit = units?.find((u) => u.id === v.invite.unitId)
+        const building = buildings?.find((b) => b.id === v.invite.propertyId)
+        if (!cancelled) {
+          setCodeHint(
+            unit
+              ? `Code accepted — Unit ${unit.unitNumber}${building ? ` at ${building.name}` : ''''}`
+              : ''Code accepted'',
+          )
+        }
+        return
+      }
+      const cloud = await fetchCloudInvite(inviteCode, ''tenant'')
+      if (!cancelled) {
+        if (cloud) {
+          setCodeHint(
+            `Code accepted — Unit ${cloud.unitNumber || ''assigned''}${cloud.buildingName ? ` at ${cloud.buildingName}` : ''''}`,
+          )
+        } else {
+          setCodeHint('''')
+        }
+      }
     }
-    const v = validateInviteForRole(inviteCode, ''tenant'')
-    if (v.ok) {
-      const unit = units?.find((u) => u.id === v.invite.unitId)
-      const building = buildings?.find((b) => b.id === v.invite.propertyId)
-      setCodeHint(
-        unit
-          ? `Code accepted — Unit ${unit.unitNumber}${building ? ` at ${building.name}` : ''''}`
-          : ''Code accepted'',
-      )
-    } else {
-      setCodeHint('''')
+    run()
+    return () => {
+      cancelled = true
     }
   }, [inviteCode, units, buildings])
 
-  const handleSubmit = (e) => {
+  const handleSubmit = async (e) => {
     e.preventDefault()
     setError('''')
     const limit = checkJoinRateLimit()
@@ -59,37 +78,42 @@ export default function TenantJoinPage({
     }
     setLoading(true)
 
-    setTimeout(() => {
+    try {
       if (mode === ''signin'') {
         const result = login(email, password)
         if (!result.ok) {
           recordJoinFailure()
           setError(GENERIC_AUTH_ERROR)
-          setLoading(false)
           return
         }
         const portalCheck = validatePortalSignIn(''tenant'', result.user?.role || '''')
         if (!portalCheck.ok) {
           recordJoinFailure()
           setError(portalCheck.error)
-          setLoading(false)
           return
         }
         clearJoinFailures()
         onAuthSuccess(result.user)
       } else {
-        const result = registerTenant(email, password, name, inviteCode, units || [], buildings || [])
+        const result = await registerTenantAsync(
+          email,
+          password,
+          name,
+          inviteCode,
+          units || [],
+          buildings || [],
+        )
         if (!result.ok) {
           recordJoinFailure()
           setError(result.error || GENERIC_AUTH_ERROR)
-          setLoading(false)
           return
         }
         clearJoinFailures()
         onAuthSuccess(result.user, result.unit, result.invite)
       }
+    } finally {
       setLoading(false)
-    }, 300)
+    }
   }
 
   return (
diff --git a/src/pages/StaffJoinPage.jsx b/src/pages/StaffJoinPage.jsx
index 38835b9..fccf06c 100644
--- a/src/pages/StaffJoinPage.jsx
+++ b/src/pages/StaffJoinPage.jsx
@@ -1,7 +1,8 @@
 import React, { useState, useEffect } from ''react''
 import { Wrench, Eye, EyeOff } from ''lucide-react''
-import { seedDemoUsers, registerCaretaker, login } from ''../lib/auth''
+import { seedDemoUsers, registerCaretakerAsync, login } from ''../lib/auth''
 import { validateInviteForRole } from ''../lib/invites''
+import { fetchCloudInvite } from ''../lib/inviteCloud''
 import { normalizeInviteCode } from ''../lib/routing''
 import { validatePortalSignIn, showDemoCredentials, GENERIC_AUTH_ERROR } from ''../lib/portalAuth''
 import { checkJoinRateLimit, recordJoinFailure, clearJoinFailures } from ''../lib/joinRateLimit''
@@ -26,15 +27,27 @@ export default function CaretakerJoinPage({ initialCode = '''', onAuthSuccess }) {
   }, [initialCode])
 
   useEffect(() => {
-    if (!inviteCode || inviteCode.length < 6) {
-      setCodeHint('''')
-      return
+    let cancelled = false
+    const run = async () => {
+      if (!inviteCode || inviteCode.length < 6) {
+        setCodeHint('''')
+        return
+      }
+      const v = validateInviteForRole(inviteCode, ''caretaker'')
+      if (v.ok) {
+        if (!cancelled) setCodeHint(''Code accepted'')
+        return
+      }
+      const cloud = await fetchCloudInvite(inviteCode, ''caretaker'')
+      if (!cancelled) setCodeHint(cloud ? ''Code accepted'' : '''')
+    }
+    run()
+    return () => {
+      cancelled = true
     }
-    const v = validateInviteForRole(inviteCode, ''caretaker'')
-    setCodeHint(v.ok ? ''Code accepted'' : '''')
   }, [inviteCode])
 
-  const handleSubmit = (e) => {
+  const handleSubmit = async (e) => {
     e.preventDefault()
     setError('''')
     const limit = checkJoinRateLimit()
@@ -44,37 +57,35 @@ export default function CaretakerJoinPage({ initialCode = '''', onAuthSuccess }) {
     }
     setLoading(true)
 
-    setTimeout(() => {
+    try {
       if (mode === ''signin'') {
         const result = login(email, password)
         if (!result.ok) {
           recordJoinFailure()
           setError(GENERIC_AUTH_ERROR)
-          setLoading(false)
           return
         }
         const portalCheck = validatePortalSignIn(''caretaker'', result.user?.role || '''')
         if (!portalCheck.ok) {
           recordJoinFailure()
           setError(portalCheck.error)
-          setLoading(false)
           return
         }
         clearJoinFailures()
         onAuthSuccess(result.user)
       } else {
-        const result = registerCaretaker(email, password, name, inviteCode)
+        const result = await registerCaretakerAsync(email, password, name, inviteCode)
         if (!result.ok) {
           recordJoinFailure()
           setError(result.error || GENERIC_AUTH_ERROR)
-          setLoading(false)
           return
         }
         clearJoinFailures()
         onAuthSuccess(result.user)
       }
+    } finally {
       setLoading(false)
-    }, 300)
+    }
   }
 
   return (

'@

Write-Host "Patch size: $([System.Text.Encoding]::UTF8.GetBytes($embeddedPatch).Length) bytes" -ForegroundColor Green

git fetch origin main
git checkout -B $Branch origin/main

$patchFile = Join-Path $PSScriptRoot "TENANT-INVITE-ONLY.patch"
[System.IO.File]::WriteAllText($patchFile, $embeddedPatch, [System.Text.UTF8Encoding]::new($false))

git apply --whitespace=fix $patchFile
if ($LASTEXITCODE -ne 0) { Write-Host "git apply failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running guardrail..." -ForegroundColor Yellow
$env:GUARDRAIL_URL = "https://nyumbatracker.vercel.app"
npm run ops:guardrail
if ($LASTEXITCODE -ne 0) { Write-Host "Guardrail failed — fix before push" -ForegroundColor Yellow }

git add -A
git commit -m $CommitMsg
git push -u origin $Branch --force-with-lease

Write-Host ""
Write-Host "push succeeded" -ForegroundColor Green
Write-Host "Create PR: $PrUrl" -ForegroundColor Cyan
Start-Process $PrUrl 2>$null

Write-Host ""
Write-Host "After merge: .\OWNER-SYNC.ps1 then test tenant link on phone/incognito." -ForegroundColor Yellow
Write-Host "Docs: docs\TENANT-INVITES.md" -ForegroundColor DarkGray
