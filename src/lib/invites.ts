import { safeGet, safeSet } from './storage'
import { normalizeInviteCode, getJoinPath } from './routing'

export type InviteStatus = 'pending' | 'used' | 'revoked'

export type InviteRecord = {
  code: string
  ownerId: string
  propertyId: string
  unitId: string
  status: InviteStatus
  expiresAt?: string | null
  createdAt: string
  usedByUserId?: string | null
}

const INVITES_KEY = 'rt_invites'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PREFIXES = ['KLA', 'NTD', 'WKO', 'JIN', 'MBR', 'GUL', 'ENT']

export const generateInviteCode = (): string => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  let suffix = ''
  for (let i = 0; i < 4; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
  return `${prefix}-${suffix}`
}

export const getInvites = (): InviteRecord[] => safeGet<InviteRecord[]>(INVITES_KEY, [])

export const saveInvites = (invites: InviteRecord[]): void => safeSet(INVITES_KEY, invites)

export const getJoinUrl = (code: string): string => {
  if (typeof window === 'undefined') return getJoinPath(code)
  return `${window.location.origin}${getJoinPath(code)}`
}

export const getShareTemplate = (code: string): string => {
  const link = getJoinUrl(code)
  return `Hi, use this link to view your rent and lease: ${link}. Your code is ${code}.`
}

export const findInvite = (code: string): InviteRecord | undefined => {
  const norm = normalizeInviteCode(code)
  return getInvites().find((i) => normalizeInviteCode(i.code) === norm)
}

export const findInviteForUnit = (unitId: string): InviteRecord | undefined =>
  getInvites().find((i) => i.unitId === unitId && i.status === 'pending')

export const createInviteForUnit = (
  ownerId: string,
  propertyId: string,
  unitId: string,
): InviteRecord => {
  const invites = getInvites()
  const revoked = invites.map((i) =>
    i.unitId === unitId && i.status === 'pending' ? { ...i, status: 'revoked' as InviteStatus } : i,
  )
  let code = generateInviteCode()
  while (revoked.some((i) => normalizeInviteCode(i.code) === normalizeInviteCode(code))) {
    code = generateInviteCode()
  }
  const record: InviteRecord = {
    code,
    ownerId,
    propertyId,
    unitId,
    status: 'pending',
    expiresAt: null,
    createdAt: new Date().toISOString(),
    usedByUserId: null,
  }
  saveInvites([...revoked, record])
  return record
}

export const regenerateInvite = (
  ownerId: string,
  propertyId: string,
  unitId: string,
  oldCode?: string,
): InviteRecord => {
  const invites = getInvites().map((i) => {
    if (i.unitId !== unitId) return i
    if (oldCode && normalizeInviteCode(i.code) !== normalizeInviteCode(oldCode)) return i
    return { ...i, status: 'revoked' as InviteStatus }
  })
  saveInvites(invites)
  return createInviteForUnit(ownerId, propertyId, unitId)
}

export type ValidateInviteResult =
  | { ok: true; invite: InviteRecord }
  | { ok: false; error: string }

export const validateInviteCode = (code: string): ValidateInviteResult => {
  const norm = normalizeInviteCode(code)
  if (!norm || norm.length < 6) {
    return { ok: false, error: 'Enter the invite code from your landlord (e.g. KLA-7F2G).' }
  }
  if (norm.startsWith('STF')) {
    return { ok: false, error: 'This code is not valid for tenant registration. Check the link your landlord sent.' }
  }
  const invite = findInvite(norm)
  if (!invite) return { ok: false, error: 'Invalid invite code. Ask your landlord for a new link or code.' }
  if (invite.status === 'revoked') {
    return { ok: false, error: 'This code was replaced. Ask your landlord for the latest code.' }
  }
  if (invite.status === 'used') {
    return { ok: false, error: 'This code was already used. Ask your landlord for a new code if you moved in.' }
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { ok: false, error: 'This invite code has expired. Contact your landlord.' }
  }
  return { ok: true, invite }
}

export const markInviteUsed = (code: string, userId: string): void => {
  const norm = normalizeInviteCode(code)
  saveInvites(
    getInvites().map((i) =>
      normalizeInviteCode(i.code) === norm
        ? { ...i, status: 'used' as InviteStatus, usedByUserId: userId }
        : i,
    ),
  )
}

/** Sync legacy unit.inviteCode fields into invite store */
export const syncInvitesFromUnits = (
  units: Array<Record<string, unknown>>,
  buildings: Array<Record<string, unknown>>,
  defaultOwnerId: string,
): void => {
  const existing = getInvites()
  const codes = new Set(existing.map((i) => normalizeInviteCode(i.code)))
  const added: InviteRecord[] = []

  for (const unit of units) {
    const raw = String(unit.inviteCode || '')
    if (!raw) continue
    const norm = normalizeInviteCode(raw)
    if (codes.has(norm)) continue
    const building = buildings.find((b) => b.id === unit.buildingId)
    const ownerId = String(unit.ownerId || building?.ownerId || defaultOwnerId)
    added.push({
      code: norm.includes('-') ? norm : raw.toUpperCase(),
      ownerId,
      propertyId: String(unit.buildingId),
      unitId: String(unit.id),
      status: unit.currentTenantId ? 'used' : 'pending',
      createdAt: new Date().toISOString(),
      usedByUserId: unit.currentTenantId ? String(unit.currentTenantId) : null,
    })
    codes.add(norm)
  }

  if (added.length) saveInvites([...existing, ...added])
}

/** v2: custom subdomain per owner (enterprise) — not implemented in v1 */
/** v2: QR code on printable tenant welcome card — not implemented in v1 */
