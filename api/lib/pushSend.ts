import webpush from 'web-push'
import { redis, subDataKey, subIndexKey, vapidConfigured } from './pushRedis'

export type PushMessage = {
  ownerId: string
  role: string
  userId?: string
  title: string
  body: string
  url?: string
  tag?: string
}

export const sendPushMessage = async (msg: PushMessage): Promise<number> => {
  if (!vapidConfigured()) return 0
  const r = redis()
  if (!r) return 0

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const ownerId = String(msg.ownerId || '').trim()
  const role = String(msg.role || '').trim()
  const userId = String(msg.userId || '').trim()
  const title = String(msg.title || 'NyumbaTrack').trim()
  const body = String(msg.body || '').trim()
  const url = String(msg.url || '/').trim()
  const tag = String(msg.tag || `nyumba-${Date.now()}`).trim()

  if (!ownerId || !role || !body) return 0

  const targets: string[] = []
  if (userId) {
    const eps = (await r.get<string[]>(subIndexKey(ownerId, role, userId))) || []
    targets.push(...eps)
  } else if (role === 'property_owner') {
    const eps = (await r.get<string[]>(subIndexKey(ownerId, role, ownerId))) || []
    targets.push(...eps)
  }

  let sent = 0
  const payload = JSON.stringify({ title, body, url, tag })

  for (const endpoint of targets) {
    const sub = await r.get<{ endpoint: string; keys: { p256dh: string; auth: string } }>(
      subDataKey(endpoint),
    )
    if (!sub?.endpoint || !sub.keys) continue
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      sent += 1
    } catch {
      await r.del(subDataKey(endpoint))
    }
  }

  return sent
}
