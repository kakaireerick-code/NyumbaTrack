import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cleanEnvValue, vapidConfigured } from '../src/lib/pushRedis.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store')
    const publicKey = cleanEnvValue(process.env.VAPID_PUBLIC_KEY)
    if (!publicKey) {
      return res.status(200).json({ ok: true, configured: false, publicKey: null })
    }
    return res.status(200).json({
      ok: true,
      publicKey,
      configured: vapidConfigured(),
    })
  } catch {
    return res.status(200).json({ ok: true, configured: false, publicKey: null })
  }
}
