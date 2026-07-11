import { describe, it, expect } from 'vitest'
import { cloudInviteToRecord, unitFromCloudInvite } from './inviteCloud'
import type { CloudInvite } from './inviteCloud'

describe('inviteCloud helpers', () => {
  it('maps cloud invite to local invite record', () => {
    const cloud: CloudInvite = {
      code: 'KLA-AB12',
      role: 'tenant',
      ownerId: 'owner-1',
      propertyId: 'b1',
      unitId: 'u1',
      status: 'pending',
      createdAt: '2026-07-11T00:00:00Z',
      unitNumber: '3B',
      buildingName: 'Sunrise Apts',
      monthlyRent: 500000,
    }
    const record = cloudInviteToRecord(cloud)
    expect(record.code).toBe('KLA-AB12')
    expect(record.unitId).toBe('u1')
  })

  it('builds unit snapshot from cloud invite', () => {
    const cloud: CloudInvite = {
      code: 'KLA-AB12',
      role: 'tenant',
      ownerId: 'owner-1',
      propertyId: 'b1',
      unitId: 'u1',
      status: 'pending',
      createdAt: '2026-07-11T00:00:00Z',
      unitNumber: '3B',
      monthlyRent: 450000,
      depositAmount: 900000,
    }
    const unit = unitFromCloudInvite(cloud)
    expect(unit.unitNumber).toBe('3B')
    expect(unit.monthlyRent).toBe(450000)
    expect(unit.status).toBe('vacant')
  })
})
