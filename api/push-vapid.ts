import type { VercelRequest, VercelResponse } from '@vercel/node'
import { vapidConfigured } from './lib/pushRedis'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const publicKey = process.env.VAPID_PUBLIC_KEY || ''
  if (!publicKey) {
    return res.status(503).json({ ok: false, error: 'VAPID not configured' })
  }
  return res.status(200).json({
    ok: true,
    publicKey,
    configured: vapidConfigured(),
  })
}
