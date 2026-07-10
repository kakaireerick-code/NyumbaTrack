import { isDeployedApp } from './environment'
import { normalizeRole, type Role } from './permissions'

export type PortalKind = 'owner' | 'tenant' | 'caretaker'

export type PortalSignInResult = { ok: true } | { ok: false; error: string }

/** Neutral message — never reveals other roles or portals */
export const GENERIC_AUTH_ERROR = 'Invalid email or password.'
export const GENERIC_INVITE_ERROR = 'Invalid or expired invite. Check the link you received or request a new one.'

const portalExpectedRole = (portal: PortalKind): Role => {
  if (portal === 'owner') return 'property_owner'
  if (portal === 'tenant') return 'tenant'
  return 'caretaker'
}

/**
 * Validates sign-in at a role-locked portal.
 * Wrong role always gets the same generic error (no cross-portal hints).
 */
export const validatePortalSignIn = (portal: PortalKind, role: string): PortalSignInResult => {
  const expected = portalExpectedRole(portal)
  const actual = normalizeRole(role || '')
  if (actual !== expected) {
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }
  return { ok: true }
}

/** Demo accounts and hints — local development only */
export const showDemoCredentials = (): boolean => !isDeployedApp()
