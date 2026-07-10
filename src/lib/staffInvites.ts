import { safeGet, safeSet } from './storage'
import { normalizeInviteCode } from './routing'

export type StaffInviteStatus = 'pending' | 'used' | 'revoked'

export type StaffInviteRecord = {
  code: string
  ownerId: string
  status: StaffInviteStatus
  expiresAt?: string | null
  createdAt: string
  usedByUserId?: string | null
}

const STAFF_INVITES_KEY = 'rt_staff_invites'
const STAFF_PREFIX = 'STF'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateStaffInviteCode = (): string => {
  let suffix = ''
  for (let i = 0; i < 4; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
  return `${STAFF_PREFIX}-${suffix}`
}

export const getStaffInvites = (): StaffInviteRecord[] =>
  safeGet<StaffInviteRecord[]>(STAFF_INVITES_KEY, [])

export const saveStaffInvites = (invites: StaffInviteRecord[]): void =>
  safeSet(STAFF_INVITES_KEY, invites)

export const getStaffJoinPath = (code?: string): string =>
  code
    ? `/staff/join/${encodeURIComponent(normalizeInviteCode(code))}`
    : '/staff/join'

export const getStaffJoinUrl = (code: string): string => {
  if (typeof window === 'undefined') return getStaffJoinPath(code)
  return `${window.location.origin}${getStaffJoinPath(code)}`
}

export const getStaffShareTemplate = (code: string): string => {
  const link = getStaffJoinUrl(code)
  return `Hi, use this link to access your caretaker portal: ${link}. Your code is ${code}.`
}

export const findStaffInvite = (code: string): StaffInviteRecord | undefined => {
  const norm = normalizeInviteCode(code)
  return getStaffInvites().find((i) => normalizeInviteCode(i.code) === norm)
}

export const findPendingStaffInviteForOwner = (ownerId: string): StaffInviteRecord | undefined =>
  getStaffInvites().find((i) => i.ownerId === ownerId && i.status === 'pending')

export const createStaffInvite = (ownerId: string): StaffInviteRecord => {
  const invites = getStaffInvites()
  const revoked = invites.map((i) =>
    i.ownerId === ownerId && i.status === 'pending'
      ? { ...i, status: 'revoked' as StaffInviteStatus }
      : i,
  )
  let code = generateStaffInviteCode()
  while (revoked.some((i) => normalizeInviteCode(i.code) === normalizeInviteCode(code))) {
    code = generateStaffInviteCode()
  }
  const record: StaffInviteRecord = {
    code,
    ownerId,
    status: 'pending',
    expiresAt: null,
    createdAt: new Date().toISOString(),
    usedByUserId: null,
  }
  saveStaffInvites([...revoked, record])
  return record
}

export const regenerateStaffInvite = (ownerId: string, oldCode?: string): StaffInviteRecord => {
  const invites = getStaffInvites().map((i) => {
    if (i.ownerId !== ownerId) return i
    if (oldCode && normalizeInviteCode(i.code) !== normalizeInviteCode(oldCode)) return i
    return { ...i, status: 'revoked' as StaffInviteStatus }
  })
  saveStaffInvites(invites)
  return createStaffInvite(ownerId)
}

export type ValidateStaffInviteResult =
  | { ok: true; invite: StaffInviteRecord }
  | { ok: false; error: string }

export const validateStaffInviteCode = (code: string): ValidateStaffInviteResult => {
  const norm = normalizeInviteCode(code)
  if (!norm || norm.length < 6) {
    return { ok: false, error: 'Enter the invite code from your property owner (e.g. STF-7F2G).' }
  }
  if (!norm.startsWith('STF')) {
    return { ok: false, error: 'This code is not a caretaker invite. Check the link your employer sent.' }
  }
  const invite = findStaffInvite(norm)
  if (!invite) {
    return { ok: false, error: 'Invalid invite code. Ask your property owner for a new link or code.' }
  }
  if (invite.status === 'revoked') {
    return { ok: false, error: 'This code was replaced. Ask your property owner for the latest code.' }
  }
  if (invite.status === 'used') {
    return { ok: false, error: 'This code was already used. Ask for a new code if you need another account.' }
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { ok: false, error: 'This invite code has expired. Contact your property owner.' }
  }
  return { ok: true, invite }
}

export const markStaffInviteUsed = (code: string, userId: string): void => {
  const norm = normalizeInviteCode(code)
  saveStaffInvites(
    getStaffInvites().map((i) =>
      normalizeInviteCode(i.code) === norm
        ? { ...i, status: 'used' as StaffInviteStatus, usedByUserId: userId }
        : i,
    ),
  )
}

export const seedDemoStaffInvite = (ownerId: string): void => {
  const existing = getStaffInvites()
  if (existing.some((i) => i.ownerId === ownerId)) return
  saveStaffInvites([
    ...existing,
    {
      code: 'STF-DEMO',
      ownerId,
      status: 'used',
      createdAt: new Date().toISOString(),
      usedByUserId: 'u-house-demo',
    },
    {
      code: 'STF-NEW1',
      ownerId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      usedByUserId: null,
    },
  ])
}
