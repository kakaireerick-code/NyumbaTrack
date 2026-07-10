import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveInvites,
  validateInviteForRole,
  createTenantInviteForUnit,
  createCaretakerInvite,
} from './invites'
import { GENERIC_INVITE_ERROR } from './portalAuth'

describe('invites', () => {
  beforeEach(() => {
    saveInvites([])
  })

  it('returns neutral error for wrong-role invite code', () => {
    const tenantInvite = createTenantInviteForUnit('owner-1', 'b1', 'u1')
    const caretakerResult = validateInviteForRole(tenantInvite.code, 'caretaker')
    expect(caretakerResult.ok).toBe(false)
    if (!caretakerResult.ok) {
      expect(caretakerResult.error).toBe(GENERIC_INVITE_ERROR)
      expect(caretakerResult.error).not.toMatch(/tenant/i)
      expect(caretakerResult.error).not.toMatch(/caretaker/i)
    }

    const caretakerInvite = createCaretakerInvite('owner-1')
    const tenantResult = validateInviteForRole(caretakerInvite.code, 'tenant')
    expect(tenantResult.ok).toBe(false)
    if (!tenantResult.ok) {
      expect(tenantResult.error).toBe(GENERIC_INVITE_ERROR)
    }
  })

  it('accepts invite when role matches', () => {
    const invite = createTenantInviteForUnit('owner-1', 'b1', 'u1')
    const result = validateInviteForRole(invite.code, 'tenant')
    expect(result.ok).toBe(true)
  })
})
