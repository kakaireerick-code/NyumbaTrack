import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import {
  applyReview,
  parseReviewBody,
  sortClaimsNewestFirst,
  validateClaimPayload,
  type StoredClaim,
} from '../src/lib/subscriptionApiHelpers'

type ClaimBody = {
  customerEmail?: string
  customerName?: string
  planId?: string
  billingCycle?: string
  amount?: number
  momoReference?: string
}

type ReviewBody = {
  action?: 'approve' | 'reject'
  momoReference?: string
  note?: string
}

const redis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const claimKey = (ref: string) => `subscription:claim:${ref.toLowerCase()}`

const requireAdmin = (req: VercelRequest): string | null => {
  const adminSecret = process.env.BILLING_ADMIN_SECRET
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!adminSecret || auth !== adminSecret) return null
  return adminSecret
}

const listClaims = async (r: Redis): Promise<StoredClaim[]> => {
  const keys = await r.keys('subscription:claim:*')
  if (!keys.length) return []
  const rows = await Promise.all(keys.map((key) => r.get<StoredClaim>(key)))
  return sortClaimsNewestFirst(rows.filter(Boolean) as StoredClaim[])
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
    const r = redis()
    if (!r) return res.status(503).json({ ok: false, error: 'Redis not configured' })
    const claims = await listClaims(r)
    const pending = claims.filter((c) => c.status === 'pending_verification').length
    return res.status(200).json({ ok: true, pending, claims })
  }

  if (req.method === 'PATCH') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
    const r = redis()
    if (!r) return res.status(503).json({ ok: false, error: 'Redis not configured' })

    const body = (req.body || {}) as ReviewBody
    const { action, momoReference, note } = parseReviewBody(body as Record<string, unknown>)
    if (!action || !momoReference) {
      return res.status(400).json({ ok: false, error: 'action and momoReference required' })
    }

    const key = claimKey(momoReference)
    const existing = await r.get<StoredClaim>(key)
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Claim not found' })
    }
    if (existing.status !== 'pending_verification') {
      return res.status(409).json({ ok: false, error: `Claim already ${existing.status}` })
    }

    const updated = applyReview(existing, action, note)
    await r.set(key, updated)
    return res.status(200).json({ ok: true, claim: updated })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const body = (req.body || {}) as ClaimBody
  const parsed = validateClaimPayload(body as Record<string, unknown>)
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, error: 'Invalid claim payload' })
  }
  const { customerEmail, momoReference, planId, billingCycle, amount } = parsed

  const r = redis()
  const claim: StoredClaim = {
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
    const existing = await r.get<StoredClaim>(claimKey(momoReference))
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
