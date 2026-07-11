import { describe, it, expect, vi } from 'vitest'
import {
  isDemoId,
  recordTouchesDemo,
  introducesDemoTouch,
  createGuardedSetter,
  filterOwnerMaintenance,
  filterOwnerUtilities,
  paymentTouchesDemo,
  isDemoMessage,
  isPracticeNotification,
} from './demoLiveSeparation'

describe('demoLiveSeparation', () => {
  it('detects demo IDs and records', () => {
    expect(isDemoId('demo-b1')).toBe(true)
    expect(isDemoId('b1')).toBe(false)
    expect(recordTouchesDemo({ tenantId: 'demo-t1' })).toBe(true)
    expect(recordTouchesDemo({ id: 'u1', tenantId: 't1' })).toBe(false)
  })

  it('detects when an update introduces demo touches', () => {
    const prev = [{ id: 'u1', tenantId: 't1' }]
    const blocked = [{ id: 'p1', tenantId: 'demo-t1' }]
    const allowed = [{ id: 'u1', tenantId: 't1' }, { id: 'u2', tenantId: 't2' }]
    expect(introducesDemoTouch(prev, blocked)).toBe(true)
    expect(introducesDemoTouch(prev, allowed)).toBe(false)
  })

  it('guarded setter blocks demo writes while demo mode is on', () => {
    const toast = vi.fn()
    let state = [{ id: 'u1', tenantId: 't1' }]
    const setter = vi.fn((updater: typeof state | ((p: typeof state) => typeof state)) => {
      state = typeof updater === 'function' ? updater(state) : updater
    })
    const guarded = createGuardedSetter(setter, true, toast, 'record payments')
    guarded((prev) => [...prev, { id: 'p1', tenantId: 'demo-t1' }])
    expect(state).toHaveLength(1)
    expect(toast).toHaveBeenCalled()
  })

  it('guarded setter allows live writes when demo mode is off', () => {
    const toast = vi.fn()
    let state = [{ id: 'u1', tenantId: 't1' }]
    const setter = vi.fn((updater: typeof state | ((p: typeof state) => typeof state)) => {
      state = typeof updater === 'function' ? updater(state) : updater
    })
    const guarded = createGuardedSetter(setter, false, toast, 'record payments')
    guarded((prev) => [...prev, { id: 'p1', tenantId: 't1' }])
    expect(state).toHaveLength(2)
    expect(toast).not.toHaveBeenCalled()
  })

  it('scopes maintenance and utilities to owner buildings', () => {
    const buildingIds = new Set(['b1'])
    const unitIds = new Set(['u1'])
    const maintenance = [
      { id: 'm1', buildingId: 'b1', unitId: 'u1' },
      { id: 'm2', buildingId: 'b2', unitId: 'u9' },
    ]
    const utilities = [
      { id: 'ut1', buildingId: 'b1' },
      { id: 'ut2', buildingId: 'b3' },
    ]
    expect(filterOwnerMaintenance(maintenance, buildingIds, unitIds)).toHaveLength(1)
    expect(filterOwnerUtilities(utilities, buildingIds)).toHaveLength(1)
  })

  it('flags demo payments, messages, and practice notifications', () => {
    expect(paymentTouchesDemo({ id: 'p1', unitId: 'demo-u1' })).toBe(true)
    expect(isDemoMessage({ id: 'demo-msg-owner-0', unitId: 'u1', tenantId: 't1' })).toBe(true)
    expect(isPracticeNotification({ title: 'Practice: rent reminder' })).toBe(true)
  })
})
