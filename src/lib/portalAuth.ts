import { isDeployedApp } from './environment'
import { isOwnerLoginRole, normalizeRole } from './permissions'

export type PortalKind = 'owner' | 'tenant' | 'staff'

export type PortalSignInResult = { ok: true } | { ok: false; error: string }

const OWNER_ONLY_MSG = 'This sign-in is for property owners only.'
const TENANT_ONLY_MSG = 'This portal is for tenants. Use the link your landlord sent you.'
const STAFF_ONLY_MSG = 'This portal is for property caretakers. Use the link your employer sent you.'

/**
 * Validates that an authenticated user may sign in at a given portal.
 * On deployed builds, roles are strictly isolated — owners cannot use tenant/caretaker portals.
 */
export const validatePortalSignIn = (portal: PortalKind, role: string): PortalSignInResult => {
  const normalized = normalizeRole(role || '')

  if (portal === 'owner') {
    if (!isOwnerLoginRole(role)) {
      return { ok: false, error: OWNER_ONLY_MSG }
    }
    return { ok: true }
  }

  if (portal === 'tenant') {
    if (normalized !== 'tenant') {
      return { ok: false, error: TENANT_ONLY_MSG }
    }
    return { ok: true }
  }

  if (portal === 'staff') {
    if (normalized !== 'housekeeper') {
      return { ok: false, error: STAFF_ONLY_MSG }
    }
    return { ok: true }
  }

  return { ok: false, error: 'Invalid portal.' }
}

/** Demo accounts and hints are for local development only. */
export const showDemoCredentials = (): boolean => !isDeployedApp()
