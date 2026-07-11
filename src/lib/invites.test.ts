import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveInvites,
  validateInviteForRole,
  createTenantInviteForUnit,
  createCaretakerInvite,
  getOrCreateTenantInvite,
  getOrCreateCaretakerInvite,
  releaseUnitInvite,
  regenerateTenantInvite,
  markInviteUsed,
  findInviteForUnit,
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

  it('getOrCreateTenantInvite reuses pending code on repeat calls', () => {
    const first = getOrCreateTenantInvite('owner-1', 'b1', 'u1')
    const second = getOrCreateTenantInvite('owner-1', 'b1', 'u1')
    expect(second.code).toBe(first.code)
    expect(findInviteForUnit('u1')?.code).toBe(first.code)
  })

  it('getOrCreateTenantInvite restores used invite instead of minting new code', () => {
    const invite = createTenantInviteForUnit('owner-1', 'b1', 'u1')
    markInviteUsed(invite.code, 'user-1')
    const restored = getOrCreateTenantInvite('owner-1', 'b1', 'u1')
    expect(restored.code).toBe(invite.code)
    expect(restored.status).toBe('pending')
    expect(validateInviteForRole(invite.code, 'tenant').ok).toBe(true)
  })

  it('getOrCreateTenantInvite restores unit.inviteCode when record missing', () => {
    const restored = getOrCreateTenantInvite('owner-1', 'b1', 'u1', 'KLA-ABCD')
    expect(restored.code).toBe('KLA-ABCD')
    expect(validateInviteForRole('KLA-ABCD', 'tenant').ok).toBe(true)
  })

  it('only regenerateTenantInvite invalidates the previous link', () => {
    const invite = getOrCreateTenantInvite('owner-1', 'b1', 'u1')
    const next = regenerateTenantInvite('owner-1', 'b1', 'u1', invite.code)
    expect(next.code).not.toBe(invite.code)
    expect(validateInviteForRole(invite.code, 'tenant').ok).toBe(false)
    expect(validateInviteForRole(next.code, 'tenant').ok).toBe(true)
  })

  it('releaseUnitInvite reactivates invite after tenant departs', () => {
    const invite = createTenantInviteForUnit('owner-1', 'b1', 'u1')
    markInviteUsed(invite.code, 'user-1')
    const released = releaseUnitInvite('owner-1', 'b1', 'u1', invite.code)
    expect(released?.code).toBe(invite.code)
    expect(released?.status).toBe('pending')
    expect(validateInviteForRole(invite.code, 'tenant').ok).toBe(true)
  })

  it('getOrCreateCaretakerInvite reuses pending caretaker code', () => {
    const first = getOrCreateCaretakerInvite('owner-1', 'b1')
    const second = getOrCreateCaretakerInvite('owner-1', 'b1')
    expect(second.code).toBe(first.code)
  })
})
