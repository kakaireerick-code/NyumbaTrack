# Tenant invite links (cross-device)

## Problem (fixed)

Invite codes lived only in the **landlord's browser** (`localStorage`). When a tenant opened `/join/tenant/KLA-XXXX` on another phone, incognito, or browser, the code did not exist locally → **"Invalid or expired invite."**

## Solution

Redis-backed **`/api/invite`** (same Upstash as billing):

| Method | Purpose |
|--------|---------|
| `POST` | Landlord syncs invite + unit snapshot (unit number, building, rent) |
| `GET ?code=&role=` | Public validation for join pages |
| `PATCH` | Mark invite used after registration |

### Landlord flow

Creating, copying, or regenerating tenant/caretaker invites calls **`pushInviteToCloud`** with unit snapshot.

### Tenant flow

Join pages use **`registerTenantAsync`** / **`registerCaretakerAsync`**:

1. Try local `localStorage` invite
2. If missing → **`fetchCloudInvite`** from Redis
3. Show **"Code accepted — Unit …"** from cloud snapshot
4. Register and **`PATCH`** mark used

## Test after deploy

1. `.\OWNER-SYNC.ps1`
2. Sign in as **owner** → vacant unit → **Invite tenant** → **Copy tenant link**
3. Open link on **phone or incognito** (not owner's browser)
4. Register → **"Code accepted — Unit …"** → tenant portal

## Env vars

Uses existing Vercel Production Redis (same as billing):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

No new secrets required.

## API examples

```bash
# Validate (public)
curl "https://nyumbatracker.vercel.app/api/invite?code=KLA-AB12&role=tenant"

# Sync (from landlord app POST)
# Mark used (from tenant app PATCH)
```

## Verify

```bash
npm test                  # includes cross-device scenario
npm run verify:features   # F16 cloud tenant invites
npm run ops:guardrail
```
