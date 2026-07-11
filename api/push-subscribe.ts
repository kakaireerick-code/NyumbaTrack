import type { VercelRequest, VercelResponse } from '@vercel/node'
import { asJsonArray, isRedisConfigured, redis, subDataKey, subIndexKey } from '../src/lib/pushRedis.js'

type SubscribeBody = {
  ownerId?: string
  role?: string
  userId?: string
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
}

const GET_HINT = 'POST JSON with ownerId, role, userId, and subscription to register push'

const parseBody = (req: VercelRequest): SubscribeBody => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return (req.body || {}) as SubscribeBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        configured: isRedisConfigured(),
        hint: GET_HINT,
      })
    }

    const r = redis()
    if (!r) {
      return res.status(200).json({ ok: true, configured: false, hint: GET_HINT })
    }

    if (req.method === 'DELETE') {
      const body = parseBody(req)
      const endpoint = String(body.subscription?.endpoint || '')
      if (!endpoint) return res.status(400).json({ ok: false, error: 'endpoint required' })
      await r.del(subDataKey(endpoint))
      return res.status(200).json({ ok: true })
    }

    if (req.method !== 'POST') {
      return res.status(200).json({ ok: true, configured: true, hint: GET_HINT })
    }

    const body = parseBody(req)
    const ownerId = String(body.ownerId || '').trim()
    const role = String(body.role || '').trim()
    const userId = String(body.userId || '').trim()
    const endpoint = String(body.subscription?.endpoint || '')
    const keys = body.subscription?.keys

    if (!ownerId || !role || !userId || !endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ ok: false, error: 'Invalid subscription payload' })
    }

    const record = {
      ownerId,
      role,
      userId,
      endpoint,
      keys,
      updatedAt: new Date().toISOString(),
    }

    await r.set(subDataKey(endpoint), record)
    const indexKey = subIndexKey(ownerId, role, userId)
    const existing = asJsonArray<string>(await r.get(indexKey))
    if (!existing.includes(endpoint)) {
      await r.set(indexKey, [...existing, endpoint])
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: true, configured: false, hint: GET_HINT })
  }
}
