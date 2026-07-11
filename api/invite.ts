import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isRedisConfigured, redis } from '../src/lib/pushRedis.js'

export type CloudInviteRecord = {
  code: string
  role: 'tenant' | 'caretaker'
  ownerId: string
  propertyId?: string
  unitId?: string
  status: 'pending' | 'used' | 'revoked'
  unitNumber?: string
  buildingName?: string
  monthlyRent?: number
  depositAmount?: number
  rentDueDay?: number
  createdAt: string
  usedByUserId?: string | null
}

const GET_HINT = 'GET ?code=INVITE&role=tenant to validate an invite code'

const normCode = (code: string) => String(code || '').trim().toUpperCase().replace(/\s+/g, '')

const inviteKey = (role: string, code: string) => `invite:${role}:${normCode(code)}`

const parseBody = (req: VercelRequest): Record<string, unknown> => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return (req.body || {}) as Record<string, unknown>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store')
    const r = redis()

    if (req.method === 'GET') {
      const code = normCode(String(req.query.code || ''))
      const role = String(req.query.role || '').toLowerCase()
      if (!code || code.length < 6 || (role !== 'tenant' && role !== 'caretaker')) {
        return res.status(200).json({
          ok: true,
          configured: isRedisConfigured(),
          hint: GET_HINT,
        })
      }
      if (!r) return res.status(200).json({ ok: true, configured: false })

      const record = await r.get<CloudInviteRecord>(inviteKey(role, code))
      if (!record || record.status !== 'pending') {
        return res.status(404).json({ ok: false, error: 'Invalid or expired invite' })
      }
      return res.status(200).json({ ok: true, invite: record })
    }

    if (req.method === 'POST') {
      if (!r) return res.status(200).json({ ok: true, configured: false })
      const body = parseBody(req)
      const code = normCode(String(body.code || ''))
      const role = body.role === 'caretaker' ? 'caretaker' : body.role === 'tenant' ? 'tenant' : ''
      const ownerId = String(body.ownerId || '').trim()
      if (!code || !role || !ownerId) {
        return res.status(400).json({ ok: false, error: 'code, role, ownerId required' })
      }

      const record: CloudInviteRecord = {
        code,
        role,
        ownerId,
        propertyId: body.propertyId ? String(body.propertyId) : undefined,
        unitId: body.unitId ? String(body.unitId) : undefined,
        status: 'pending',
        unitNumber: body.unitNumber ? String(body.unitNumber) : undefined,
        buildingName: body.buildingName ? String(body.buildingName) : undefined,
        monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : undefined,
        depositAmount: body.depositAmount != null ? Number(body.depositAmount) : undefined,
        rentDueDay: body.rentDueDay != null ? Number(body.rentDueDay) : undefined,
        createdAt: String(body.createdAt || new Date().toISOString()),
        usedByUserId: null,
      }

      await r.set(inviteKey(role, code), record)
      return res.status(200).json({ ok: true, invite: record })
    }

    if (req.method === 'PATCH') {
      if (!r) return res.status(200).json({ ok: true, configured: false })
      const body = parseBody(req)
      const code = normCode(String(body.code || ''))
      const role = body.role === 'caretaker' ? 'caretaker' : body.role === 'tenant' ? 'tenant' : ''
      const userId = String(body.userId || '').trim()
      if (!code || !role || !userId) {
        return res.status(400).json({ ok: false, error: 'code, role, userId required' })
      }

      const key = inviteKey(role, code)
      const existing = await r.get<CloudInviteRecord>(key)
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'Invite not found' })
      }
      const updated: CloudInviteRecord = {
        ...existing,
        status: 'used',
        usedByUserId: userId,
      }
      await r.set(key, updated)
      return res.status(200).json({ ok: true, invite: updated })
    }

    return res.status(200).json({ ok: true, hint: 'GET, POST, or PATCH supported' })
  } catch {
    return res.status(200).json({ ok: true, configured: false, hint: GET_HINT })
  }
}
