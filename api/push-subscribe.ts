import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, subDataKey, subIndexKey } from '../src/lib/pushRedis.js'

type SubscribeBody = {
  ownerId?: string
  role?: string
  userId?: string
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
}

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
  res.setHeader('Cache-Control', 'no-store')
  const r = redis()
  if (!r) return res.status(503).json({ ok: false, error: 'Redis not configured' })

  if (req.method === 'DELETE') {
    const body = parseBody(req)
    const endpoint = String(body.subscription?.endpoint || '')
    if (!endpoint) return res.status(400).json({ ok: false, error: 'endpoint required' })
    await r.del(subDataKey(endpoint))
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
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
  const existing = (await r.get<string[]>(indexKey)) || []
  if (!existing.includes(endpoint)) {
    await r.set(indexKey, [...existing, endpoint])
  }

  return res.status(200).json({ ok: true })
}
