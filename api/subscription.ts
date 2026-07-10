import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

type ClaimBody = {
  customerEmail?: string
  customerName?: string
  planId?: string
  billingCycle?: string
  amount?: number
  momoReference?: string
}

const redis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const claimKey = (ref: string) => `subscription:claim:${ref.toLowerCase()}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const adminSecret = process.env.BILLING_ADMIN_SECRET
    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!adminSecret || auth !== adminSecret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
    const r = redis()
    if (!r) return res.status(503).json({ ok: false, error: 'Redis not configured' })
    const pending = await r.keys('subscription:claim:*')
    return res.status(200).json({ ok: true, pending: pending.length })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const body = (req.body || {}) as ClaimBody
  const customerEmail = String(body.customerEmail || '').trim().toLowerCase()
  const momoReference = String(body.momoReference || '').trim()
  const planId = String(body.planId || '').trim()
  const billingCycle = String(body.billingCycle || 'monthly').trim()
  const amount = Number(body.amount || 0)

  if (!customerEmail || !momoReference || momoReference.length < 6 || !planId || !amount) {
    return res.status(400).json({ ok: false, error: 'Invalid claim payload' })
  }

  const r = redis()
  const claim = {
    id: `claim-${Date.now()}`,
    customerEmail,
    customerName: String(body.customerName || 'Customer'),
    planId,
    billingCycle,
    amount,
    momoReference,
    status: 'pending_verification',
    submittedAt: new Date().toISOString(),
  }

  if (r) {
    const existing = await r.get(claimKey(momoReference))
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Transaction reference already submitted' })
    }
    await r.set(claimKey(momoReference), claim)
  }

  return res.status(200).json({
    ok: true,
    status: 'pending_verification',
    claim,
    message: 'Payment submitted for admin verification. You will be activated after MoMo is confirmed.',
  })
}
