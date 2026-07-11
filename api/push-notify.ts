import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isRedisConfigured, vapidConfigured } from '../src/lib/pushRedis.js'
import { sendPushMessage } from '../src/lib/pushSend.js'

type NotifyBody = {
  ownerId?: string
  role?: string
  userId?: string
  title?: string
  body?: string
  url?: string
  tag?: string
}

const GET_HINT = 'POST JSON with ownerId, role, and body to send a push notification'

const parseBody = (req: VercelRequest): NotifyBody => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return (req.body || {}) as NotifyBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'POST') {
      return res.status(200).json({
        ok: true,
        configured: vapidConfigured() && isRedisConfigured(),
        hint: GET_HINT,
      })
    }

    if (!vapidConfigured()) {
      return res.status(200).json({ ok: true, configured: false, sent: 0 })
    }

    const body = parseBody(req)
    const ownerId = String(body.ownerId || '').trim()
    const role = String(body.role || '').trim()
    const msgBody = String(body.body || '').trim()

    if (!ownerId || !role || !msgBody) {
      return res.status(400).json({ ok: false, error: 'ownerId, role, body required' })
    }

    const sent = await sendPushMessage({
      ownerId,
      role,
      userId: body.userId,
      title: body.title,
      body: msgBody,
      url: body.url,
      tag: body.tag,
    })

    return res.status(200).json({ ok: true, sent })
  } catch {
    return res.status(200).json({ ok: true, configured: false, sent: 0, hint: GET_HINT })
  }
}
