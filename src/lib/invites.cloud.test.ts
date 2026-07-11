import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveInvites,
  validateInviteForRoleAsync,
  createTenantInviteForUnit,
} from './invites'
import { registerTenantAsync } from './auth'

describe('cross-device tenant invite', () => {
  beforeEach(() => {
    saveInvites([])
    vi.restoreAllMocks()
  })

  it('validateInviteForRoleAsync falls back to cloud when local missing', async () => {
    const cloudInvite = {
      code: 'KLA-CLOUD',
      role: 'tenant',
      ownerId: 'owner-1',
      propertyId: 'b1',
      unitId: 'u-remote',
      status: 'pending',
      unitNumber: '5A',
      buildingName: 'Cloud Tower',
      monthlyRent: 600000,
      createdAt: new Date().toISOString(),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/api/invite')) {
          return {
            ok: true,
            json: async () => ({ ok: true, invite: cloudInvite }),
          }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )

    const result = await validateInviteForRoleAsync('KLA-CLOUD', 'tenant')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.cloud).toBe(true)
      expect(result.invite.unitId).toBe('u-remote')
    }
  })

  it('registerTenantAsync registers tenant from cloud invite on empty local storage', async () => {
    const cloudInvite = {
      code: 'KLA-PHONE',
      role: 'tenant',
      ownerId: 'owner-1',
      propertyId: 'b1',
      unitId: 'u-phone',
      status: 'pending',
      unitNumber: '2C',
      buildingName: 'Phone Block',
      monthlyRent: 400000,
      depositAmount: 800000,
      createdAt: new Date().toISOString(),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method || 'GET'
        if (String(url).includes('/api/invite') && method === 'GET') {
          return {
            ok: true,
            json: async () => ({ ok: true, invite: cloudInvite }),
          }
        }
        if (String(url).includes('/api/invite') && method === 'PATCH') {
          return { ok: true, json: async () => ({ ok: true }) }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )

    const result = await registerTenantAsync(
      'tenant.phone@example.com',
      'pass1234',
      'Phone Tenant',
      'KLA-PHONE',
      [],
      [],
    )

    expect(result.ok).toBe(true)
    expect(result.user?.role).toBe('tenant')
    expect(result.unit?.unitNumber).toBe('2C')
  })

  it('local invite still works without cloud', async () => {
    const invite = createTenantInviteForUnit('owner-1', 'b1', 'u1')
    const result = await registerTenantAsync(
      'local.tenant@example.com',
      'pass1234',
      'Local Tenant',
      invite.code,
      [{ id: 'u1', buildingId: 'b1', unitNumber: '1A', monthlyRent: 300000, status: 'vacant' }],
      [{ id: 'b1', name: 'Local Building' }],
    )
    expect(result.ok).toBe(true)
  })
})
