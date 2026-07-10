import { safeGet, safeSet } from './storage'
import { normalizeInviteCode, getJoinUrl } from './routing'
import { GENERIC_INVITE_ERROR } from './portalAuth'

export type InviteRole = 'tenant' | 'caretaker'
export type InviteStatus = 'pending' | 'used' | 'revoked'

export type InviteRecord = {
  code: string
  role: InviteRole
  ownerId: string
  propertyId?: string
  unitId?: string
  scopeUnitIds?: string[]
  status: InviteStatus
  expiresAt?: string | null
  createdAt: string
  usedByUserId?: string | null
}

const INVITES_KEY = 'rt_invites'
const LEGACY_STAFF_KEY = 'rt_staff_invites'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TENANT_PREFIXES = ['KLA', 'NTD', 'WKO', 'JIN', 'MBR', 'GUL', 'ENT']
const CARETAKER_PREFIX = 'CTR'

const randomSuffix = (len = 4): string => {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

export const generateInviteCode = (role: InviteRole): string => {
  if (role === 'caretaker') return `${CARETAKER_PREFIX}-${randomSuffix()}`
  const prefix = TENANT_PREFIXES[Math.floor(Math.random() * TENANT_PREFIXES.length)]
  return `${prefix}-${randomSuffix()}`
}

export const getInvites = (): InviteRecord[] => {
  migrateLegacyStaffInvites()
  return safeGet<InviteRecord[]>(INVITES_KEY, [])
}

export const saveInvites = (invites: InviteRecord[]): void => safeSet(INVITES_KEY, invites)

const migrateLegacyStaffInvites = (): void => {
  const legacy = safeGet<Array<Record<string, unknown>>>(LEGACY_STAFF_KEY, [])
  if (!legacy.length) return
  const existing = safeGet<InviteRecord[]>(INVITES_KEY, [])
  const codes = new Set(existing.map((i) => normalizeInviteCode(i.code)))
  const migrated: InviteRecord[] = []
  for (const row of legacy) {
    const code = normalizeInviteCode(String(row.code || ''))
    if (!code || codes.has(code)) continue
    migrated.push({
      code,
      role: 'caretaker',
      ownerId: String(row.ownerId || ''),
      status: (row.status as InviteStatus) || 'pending',
      expiresAt: (row.expiresAt as string) || null,
      createdAt: String(row.createdAt || new Date().toISOString()),
      usedByUserId: (row.usedByUserId as string) || null,
    })
    codes.add(code)
  }
  if (migrated.length) saveInvites([...existing, ...migrated])
  safeSet(LEGACY_STAFF_KEY, [])
}

export const getShareTemplate = (role: InviteRole, code: string): string => {
  const link = getJoinUrl(role, code)
  if (role === 'caretaker') {
    return `Hi, use this link to access your property portal: ${link}. Your code is ${code}.`
  }
  return `Hi, use this link to view your unit and lease: ${link}. Your code is ${code}.`
}

export const findInvite = (code: string): InviteRecord | undefined => {
  const norm = normalizeInviteCode(code)
  return getInvites().find((i) => normalizeInviteCode(i.code) === norm)
}

export const findInviteForUnit = (unitId: string): InviteRecord | undefined =>
  getInvites().find((i) => i.role === 'tenant' && i.unitId === unitId && i.status === 'pending')

export const findPendingCaretakerInviteForOwner = (ownerId: string): InviteRecord | undefined =>
  getInvites().find((i) => i.role === 'caretaker' && i.ownerId === ownerId && i.status === 'pending')

export const createTenantInviteForUnit = (
  ownerId: string,
  propertyId: string,
  unitId: string,
): InviteRecord => {
  const invites = getInvites()
  const revoked = invites.map((i) =>
    i.unitId === unitId && i.role === 'tenant' && i.status === 'pending'
      ? { ...i, status: 'revoked' as InviteStatus }
      : i,
  )
  let code = generateInviteCode('tenant')
  while (revoked.some((i) => normalizeInviteCode(i.code) === normalizeInviteCode(code))) {
    code = generateInviteCode('tenant')
  }
  const record: InviteRecord = {
    code,
    role: 'tenant',
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

export const createCaretakerInvite = (ownerId: string, propertyId?: string): InviteRecord => {
  const invites = getInvites()
  const revoked = invites.map((i) =>
    i.ownerId === ownerId && i.role === 'caretaker' && i.status === 'pending'
      ? { ...i, status: 'revoked' as InviteStatus }
      : i,
  )
  let code = generateInviteCode('caretaker')
  while (revoked.some((i) => normalizeInviteCode(i.code) === normalizeInviteCode(code))) {
    code = generateInviteCode('caretaker')
  }
  const record: InviteRecord = {
    code,
    role: 'caretaker',
    ownerId,
    propertyId,
    status: 'pending',
    expiresAt: null,
    createdAt: new Date().toISOString(),
    usedByUserId: null,
  }
  saveInvites([...revoked, record])
  return record
}

export const regenerateTenantInvite = (
  ownerId: string,
  propertyId: string,
  unitId: string,
  oldCode?: string,
): InviteRecord => {
  const invites = getInvites().map((i) => {
    if (i.unitId !== unitId || i.role !== 'tenant') return i
    if (oldCode && normalizeInviteCode(i.code) !== normalizeInviteCode(oldCode)) return i
    return { ...i, status: 'revoked' as InviteStatus }
  })
  saveInvites(invites)
  return createTenantInviteForUnit(ownerId, propertyId, unitId)
}

export const regenerateCaretakerInvite = (ownerId: string, oldCode?: string): InviteRecord => {
  const invites = getInvites().map((i) => {
    if (i.ownerId !== ownerId || i.role !== 'caretaker') return i
    if (oldCode && normalizeInviteCode(i.code) !== normalizeInviteCode(oldCode)) return i
    return { ...i, status: 'revoked' as InviteStatus }
  })
  saveInvites(invites)
  return createCaretakerInvite(ownerId)
}

export type ValidateInviteResult =
  | { ok: true; invite: InviteRecord }
  | { ok: false; error: string }

export const validateInviteForRole = (
  code: string,
  expectedRole: InviteRole,
): ValidateInviteResult => {
  const norm = normalizeInviteCode(code)
  if (!norm || norm.length < 6) {
    return { ok: false, error: GENERIC_INVITE_ERROR }
  }
  const invite = findInvite(norm)
  if (!invite) return { ok: false, error: GENERIC_INVITE_ERROR }
  if (invite.role !== expectedRole) return { ok: false, error: GENERIC_INVITE_ERROR }
  if (invite.status === 'revoked' || invite.status === 'used') {
    return { ok: false, error: GENERIC_INVITE_ERROR }
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { ok: false, error: GENERIC_INVITE_ERROR }
  }
  return { ok: true, invite }
}

/** @deprecated use validateInviteForRole(code, 'tenant') */
export const validateInviteCode = (code: string): ValidateInviteResult =>
  validateInviteForRole(code, 'tenant')

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
      role: 'tenant',
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

export const seedDemoInvites = (ownerId: string): void => {
  const existing = getInvites()
  if (existing.some((i) => i.ownerId === ownerId)) return
  saveInvites([
    ...existing,
    {
      code: 'CTR-DEMO',
      role: 'caretaker',
      ownerId,
      status: 'used',
      createdAt: new Date().toISOString(),
      usedByUserId: 'u-house-demo',
    },
    {
      code: 'CTR-NEW1',
      role: 'caretaker',
      ownerId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      usedByUserId: null,
    },
  ])
}

// Back-compat exports for existing imports
export const createInviteForUnit = createTenantInviteForUnit
export const regenerateInvite = regenerateTenantInvite
export { getJoinUrl } from './routing'
