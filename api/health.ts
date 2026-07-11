import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis, vapidConfigured, vapidEnvStatus } from '../src/lib/pushRedis.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const r = redis()
  const vapid = vapidConfigured()
  res.status(200).json({
    ok: true,
    service: 'nyumbatrack',
    region: 'uganda',
    timestamp: new Date().toISOString(),
    vapid,
    push: Boolean(r),
    vapidEnv: vapid ? undefined : vapidEnvStatus(),
  })
}
