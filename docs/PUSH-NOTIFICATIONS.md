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

1. **Tab hidden** — local watcher shows OS notifications (no VAPID required)
2. **App closed** — Web Push via Redis (needs VAPID keys on Vercel)

## Owner setup (one-time per deploy)

```powershell
cd C:\Users\Erik\Documents\NyumbaTrack
.\PUSH-PUSH-NOTIFICATIONS.ps1
```

After merge + VAPID keys + redeploy:

```bash
npm run generate:vapid   # on PC — paste keys into Vercel
npm run check:vapid      # /api/health should show vapid: true, push: true
.\OWNER-SYNC.ps1
```

### Vercel env (Production)

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@domain.com
```

Redis vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) already exist from billing.

## User setup (each phone)

1. Open https://nyumbatracker.vercel.app
2. iPhone: Safari → Share → **Add to Home Screen**
3. Sign in → bell icon → **Enable phone notifications** → Allow
4. Turn on **When app is closed (PWA)**

## What triggers push

- Receipt issued → owner + tenant
- Rent reminder / due / overdue → tenant (+ owner nudge)
- Tenant joins via invite → owner
- Subscription trial/renewal, MoMo pending, admin approval
- Maintenance logged/resolved, aging repairs, lease expiring
- Setup nudges (no properties, vacant units, MoMo missing, demo mode)
- Unread messages, caretaker daily check
- Any `addNotification()` call with `push: true` (default)

Automatic engine runs every **60 seconds** while logged in.

## Verify

```bash
npm test                  # 67 tests
npm run verify:features   # F1–F17
npm run build
```

## Troubleshooting

- **Enable phone notifications fails** — check `/api/push-vapid` returns `publicKey`; set VAPID env and redeploy.
- **`check:vapid` fails** — Redis + VAPID must both be set on Vercel Production.
- **403 on cloud agent push** — run `PUSH-PUSH-NOTIFICATIONS.ps1` on your PC instead.
