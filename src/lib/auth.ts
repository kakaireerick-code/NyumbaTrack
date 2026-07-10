import { safeGet, safeSet } from './storage'
import { validateInviteForRole, markInviteUsed, seedDemoInvites } from './invites'
import { GENERIC_INVITE_ERROR, GENERIC_AUTH_ERROR } from './portalAuth'
import { isDeployedApp } from './environment'
import { normalizeInviteCode } from './routing'
import type { Role } from './permissions'

export type AppUser = {
  id: string
  email: string
  passwordHash?: string
  name: string
  role: Role
  authProvider?: 'email' | 'google'
  googleId?: string
  picture?: string
  ownerId?: string
  tenantId?: string
  unitId?: string
  buildingId?: string
  failedAttempts?: number
  lockedUntil?: string | null
}

export type GoogleProfile = {
  sub: string
  email: string
  name: string
  picture?: string
}

const USERS_KEY = 'rent_app_users'
const LOCK_THRESHOLD = 5
const LOCK_MINUTES = 15

const simpleHash = (s: string): string => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `h${Math.abs(h)}`
}

export const getUsers = (): AppUser[] => safeGet<AppUser[]>(USERS_KEY, [])

export const saveUsers = (users: AppUser[]): void => safeSet(USERS_KEY, users)

export { generateInviteCode } from './invites'

export const registerOwner = (
  email: string,
  password: string,
  name: string,
): { ok: boolean; error?: string; user?: AppUser } => {
  if (!email?.trim() || !password || password.length < 6) {
    return { ok: false, error: 'Email and password (6+ characters) required.' }
  }
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  const id = `u-${Date.now()}`
  const user: AppUser = {
    id,
    email: email.trim().toLowerCase(),
    passwordHash: simpleHash(password),
    name: name.trim() || email.split('@')[0],
    role: 'property_owner',
    ownerId: id,
  }
  saveUsers([...users, user])
  return { ok: true, user }
}

export const registerTenant = (
  email: string,
  password: string,
  name: string,
  inviteCode: string,
  units: Array<Record<string, unknown>>,
  buildings: Array<Record<string, unknown>> = [],
): {
  ok: boolean
  error?: string
  user?: AppUser
  unit?: Record<string, unknown>
  invite?: { ownerId: string; propertyId: string; unitId: string; code: string }
} => {
  if (!inviteCode?.trim()) return { ok: false, error: GENERIC_INVITE_ERROR }
  if (!password || password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' }
  }

  const code = normalizeInviteCode(inviteCode)
  const validation = validateInviteForRole(code, 'tenant')
  if (!validation.ok) return { ok: false, error: validation.error }

  const { invite } = validation
  const unit =
    units.find((u) => String(u.id) === invite.unitId) ||
    units.find((u) => normalizeInviteCode(String(u.inviteCode || '')) === normalizeInviteCode(invite.code))

  if (!unit) return { ok: false, error: GENERIC_INVITE_ERROR }
  if (unit.status === 'occupied' && unit.currentTenantId) {
    return { ok: false, error: GENERIC_INVITE_ERROR }
  }

  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }

  const user: AppUser = {
    id: `u-${Date.now()}`,
    email: email.trim().toLowerCase(),
    passwordHash: simpleHash(password),
    name: name.trim(),
    role: 'tenant',
    ownerId: invite.ownerId,
    unitId: String(unit.id),
    buildingId: String(unit.buildingId || invite.propertyId),
  }

  saveUsers([...users, user])
  markInviteUsed(invite.code, user.id)

  return {
    ok: true,
    user,
    unit,
    invite: {
      ownerId: invite.ownerId,
      propertyId: String(invite.propertyId || unit.buildingId),
      unitId: String(unit.id),
      code: invite.code,
    },
  }
}

export const registerCaretaker = (
  email: string,
  password: string,
  name: string,
  inviteCode: string,
): { ok: boolean; error?: string; user?: AppUser } => {
  if (!inviteCode?.trim()) return { ok: false, error: GENERIC_INVITE_ERROR }
  if (!password || password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' }
  }

  const code = normalizeInviteCode(inviteCode)
  const validation = validateInviteForRole(code, 'caretaker')
  if (!validation.ok) return { ok: false, error: validation.error }

  const { invite } = validation
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }

  const user: AppUser = {
    id: `u-${Date.now()}`,
    email: email.trim().toLowerCase(),
    passwordHash: simpleHash(password),
    name: name.trim(),
    role: 'caretaker',
    ownerId: invite.ownerId,
  }

  saveUsers([...users, user])
  markInviteUsed(invite.code, user.id)
  return { ok: true, user }
}

/** @deprecated use registerCaretaker */
export const registerHousekeeper = registerCaretaker

export const login = (
  email: string,
  password: string,
): { ok: boolean; error?: string; user?: AppUser } => {
  const users = getUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) return { ok: false, error: GENERIC_AUTH_ERROR }
  if (user.authProvider === 'google' && !user.passwordHash) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return { ok: false, error: 'Account temporarily locked. Try again later.' }
  }
  if (user.passwordHash !== simpleHash(password)) {
    const failed = (user.failedAttempts || 0) + 1
    const updated = users.map((u) =>
      u.id === user.id
        ? {
            ...u,
            failedAttempts: failed,
            lockedUntil: failed >= LOCK_THRESHOLD
              ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
              : u.lockedUntil,
          }
        : u,
    )
    saveUsers(updated)
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }
  const cleared = users.map((u) =>
    u.id === user.id ? { ...u, failedAttempts: 0, lockedUntil: null } : u,
  )
  saveUsers(cleared)
  return { ok: true, user: { ...user, failedAttempts: 0, lockedUntil: null } }
}

export const loginOrRegisterWithGoogle = (
  profile: GoogleProfile,
  role: 'property_owner' | 'tenant' = 'property_owner',
): { ok: boolean; error?: string; user?: AppUser; isNew?: boolean } => {
  if (!profile?.email || !profile?.sub) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }
  const users = getUsers()
  const email = profile.email.trim().toLowerCase()
  const existing = users.find((u) => u.googleId === profile.sub || u.email === email)

  if (existing) {
    const updated = users.map((u) =>
      u.id === existing.id
        ? {
            ...u,
            name: profile.name || u.name,
            picture: profile.picture || u.picture,
            googleId: profile.sub,
            authProvider: 'google' as const,
            failedAttempts: 0,
            lockedUntil: null,
          }
        : u,
    )
    saveUsers(updated)
    const user = updated.find((u) => u.id === existing.id)!
    return { ok: true, user, isNew: false }
  }

  if (users.some((u) => u.email === email)) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }

  if (role === 'tenant') {
    return { ok: false, error: GENERIC_INVITE_ERROR }
  }

  const id = `u-google-${Date.now()}`
  const user: AppUser = {
    id,
    email,
    name: profile.name || email.split('@')[0],
    role: 'property_owner',
    authProvider: 'google',
    googleId: profile.sub,
    picture: profile.picture,
    passwordHash: '',
    ownerId: id,
  }
  saveUsers([...users, user])
  return { ok: true, user, isNew: true }
}

export const seedDemoUsers = (): void => {
  if (isDeployedApp()) return
  const users = getUsers()
  if (users.length > 0) return
  const ownerId = 'u-owner-demo'
  saveUsers([
    {
      id: ownerId,
      email: 'owner@demo.com',
      passwordHash: simpleHash('owner123'),
      name: 'Demo Owner',
      role: 'property_owner',
      ownerId,
    },
    {
      id: 'u-house-demo',
      email: 'keeper@demo.com',
      passwordHash: simpleHash('keeper123'),
      name: 'James Okello',
      role: 'caretaker',
      ownerId,
    },
    {
      id: 'u-tenant-demo',
      email: 'tenant@demo.com',
      passwordHash: simpleHash('tenant123'),
      name: 'David Ssempijja',
      role: 'tenant',
      ownerId,
      tenantId: 't1',
      unitId: 'u1',
      buildingId: 'b1',
    },
  ])
  seedDemoInvites(ownerId)
}
