# Web push notifications (PWA)

NyumbaTrack alerts users when the browser tab is hidden or the app is closed (installed PWA).

## Architecture

| Piece | Purpose |
|-------|---------|
| `public/sw.js` | Receives push when app is closed; handles notification clicks |
| `api/push-vapid` | Public VAPID key for device subscription |
| `api/push-subscribe` | Stores device subscriptions in Redis |
| `api/push-notify` | Sends push to owner / tenant / caretaker by role |
| Bell → **Enable phone notifications** | Permission + subscribe flow |
| `addNotification()` | In-app inbox + remote push to other devices |

## Two modes

1. **Tab hidden** — OS notifications via Notification API (works in Chrome, Firefox, Edge, Safari; no VAPID required)
2. **App closed** — Web Push via Redis (needs VAPID keys on Vercel + supported browser)

## Browser support

| Browser | Tab hidden | Closed app (PWA) |
|---------|------------|-------------------|
| Chrome / Edge (desktop & Android) | Yes | Yes (with VAPID) |
| Firefox (desktop & Android) | Yes | Yes (with VAPID) |
| Safari macOS 16+ | Yes | Yes (with VAPID) |
| Safari iOS 16.4+ | Yes (after Allow) | Yes — **must Add to Home Screen first** |
| Samsung Internet | Yes | Yes (with VAPID) |

If VAPID is not on the server yet, **Enable phone notifications** still turns on tab-hidden alerts.

## Owner setup (one-time)

### Easy path (recommended)

```powershell
cd C:\Users\Erik\Documents\NyumbaTrack
git pull origin main
.\SETUP-VAPID.ps1
```

Walks through key generation, Vercel env (manual or `VERCEL_TOKEN`), redeploy, and `npm run check:vapid`.

### Manual path

```powershell
npm run generate:vapid
```

Paste into **Vercel → nyumbatrack → Settings → Environment Variables → Production**:

| Variable | Value |
|----------|-------|
| `VAPID_PUBLIC_KEY` | from script |
| `VAPID_PRIVATE_KEY` | from script |
| `VAPID_SUBJECT` | `mailto:you@domain.com` |

Redeploy, then:

```powershell
npm run check:vapid
.\OWNER-SYNC.ps1
```

### One-shot with Vercel token

```powershell
$env:VERCEL_TOKEN = "your_token"
$env:VAPID_SUBJECT = "mailto:you@domain.com"
npm run setup:vapid
```

Optional: `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` if auto-detect fails.

### Pass criteria

- `/api/health` → `"vapid": true`, `"push": true`
- `/api/push-vapid` → `"configured": true` with `publicKey`

Redis vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) already exist from billing.

## User setup (each phone)

1. Open https://nyumbatracker.vercel.app
2. **iPhone:** Safari → Share → **Add to Home Screen** (required for closed-app push)
3. Sign in → bell → **Enable phone notifications** → Allow
4. Turn on **When app is closed (PWA)** if your browser supports it

## What triggers push

- Receipt issued → owner + tenant
- Rent due / overdue → tenant (+ owner nudge)
- Tenant joins via invite → owner
- Subscription trial/renewal, MoMo pending, admin approval
- Maintenance logged/resolved, aging repairs, lease expiring
- Setup nudges, unread messages, caretaker daily check
- Any `addNotification()` call (push on by default)

Automatic engine runs every **60 seconds** while logged in.

## Verify

```bash
npm test                  # 68+ tests
npm run verify:features   # F1–F18
npm run check:vapid
```

## Troubleshooting

- **`vapid: false` on /api/health** — expected until `SETUP-VAPID.ps1` completes; not a regression.
- **Enable phone notifications** — tab mode works without VAPID; closed-app needs VAPID + redeploy.
- **iPhone** — open from Home Screen icon, not Safari tab, for closed-app push.
- **Redeploy not finished** — wait 2 min, re-run `npm run check:vapid`.

Ship tooling updates: `.\PUSH-VAPID-SETUP.ps1`
