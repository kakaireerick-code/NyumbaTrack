import type { InviteRecord, InviteRole } from './invites'
import { normalizeInviteCode } from './routing'

export type CloudInvite = InviteRecord & {
  unitNumber?: string
  buildingName?: string
  monthlyRent?: number
  depositAmount?: number
  rentDueDay?: number
}

export type UnitInviteSnapshot = {
  unitNumber?: string
  buildingName?: string
  monthlyRent?: number
  depositAmount?: number
  rentDueDay?: number
}

const cloudEnabled = () =>
  typeof fetch !== 'undefined' && typeof window !== 'undefined'

export const syncCloudInvite = async (
  invite: InviteRecord,
  snapshot?: UnitInviteSnapshot,
): Promise<boolean> => {
  if (!cloudEnabled()) return false
  try {
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: invite.code,
        role: invite.role,
        ownerId: invite.ownerId,
        propertyId: invite.propertyId,
        unitId: invite.unitId,
        createdAt: invite.createdAt,
        ...snapshot,
      }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok === true
  } catch {
    return false
  }
}

export const fetchCloudInvite = async (
  code: string,
  role: InviteRole,
): Promise<CloudInvite | null> => {
  const norm = normalizeInviteCode(code)
  if (!norm || norm.length < 6) return null
  try {
    const qs = new URLSearchParams({ code: norm, role })
    const res = await fetch(`/api/invite?${qs}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.invite) return null
    return data.invite as CloudInvite
  } catch {
    return null
  }
}

export const markCloudInviteUsed = async (
  code: string,
  role: InviteRole,
  userId: string,
): Promise<boolean> => {
  try {
    const res = await fetch('/api/invite', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalizeInviteCode(code), role, userId }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.ok === true
  } catch {
    return false
  }
}

/** Build a minimal unit object from cloud invite for cross-device registration */
export const unitFromCloudInvite = (invite: CloudInvite): Record<string, unknown> => ({
  id: invite.unitId,
  buildingId: invite.propertyId,
  ownerId: invite.ownerId,
  unitNumber: invite.unitNumber || 'Unit',
  monthlyRent: invite.monthlyRent ?? 0,
  depositAmount: invite.depositAmount ?? 0,
  rentDueDay: invite.rentDueDay ?? 5,
  status: 'vacant',
  currentTenantId: null,
  inviteCode: invite.code,
})

export const cloudInviteToRecord = (cloud: CloudInvite): InviteRecord => ({
  code: cloud.code,
  role: cloud.role,
  ownerId: cloud.ownerId,
  propertyId: cloud.propertyId,
  unitId: cloud.unitId,
  status: cloud.status,
  expiresAt: cloud.expiresAt ?? null,
  createdAt: cloud.createdAt,
  usedByUserId: cloud.usedByUserId ?? null,
})
