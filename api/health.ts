import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, vapidConfigured } from '../src/lib/pushRedis.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const r = redis()
  res.status(200).json({
    ok: true,
    service: 'nyumbatrack',
    region: 'uganda',
    timestamp: new Date().toISOString(),
    vapid: vapidConfigured(),
    push: Boolean(r),
  })
}
