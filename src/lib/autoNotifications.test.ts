import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./pushDispatch', () => ({
  dispatchPushForNotification: vi.fn(),
}))

import { runAutoNotifications } from './autoNotifications'
import { getNotifications } from './notifications'

const baseCtx = {
  role: 'property_owner',
  ownerId: 'owner-1',
  userId: 'owner-1',
  buildings: [],
  units: [],
  tenants: [],
  payments: [],
  maintenance: [],
  subscription: { status: 'none', hasUsedTrial: false },
  settings: {},
  demoMode: false,
  unreadMessages: 0,
}

describe('autoNotifications', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('nudges owner to add first property', () => {
    runAutoNotifications(baseCtx)
    const items = getNotifications().filter((n) => n.ownerId === 'owner-1')
    expect(items.some((n) => n.title.includes('first property'))).toBe(true)
  })

  it('dedupes rent due reminders per day', () => {
    const ctx = {
      ...baseCtx,
      role: 'tenant',
      userId: 'tenant-user',
      tenants: [
        {
          id: 't1',
          userId: 'tenant-user',
          status: 'Active',
          rentDueDay: new Date().getDate(),
          rentAmount: 500000,
        },
      ],
      payments: [],
    }
    runAutoNotifications(ctx)
    runAutoNotifications(ctx)
    const due = getNotifications().filter((n) => n.title === 'Rent due today')
    expect(due).toHaveLength(1)
  })

  it('skips unread owner alerts while demo mode is on', () => {
    runAutoNotifications({
      ...baseCtx,
      buildings: [{ id: 'b1' }],
      units: [{ id: 'u1', status: 'occupied' }],
      tenants: [{ id: 't1', status: 'Active', rentAmount: 500000 }],
      settings: { mtnMomo: '+256700000000' },
      demoMode: true,
      unreadMessages: 2,
    })
    expect(getNotifications().some((n) => n.title === 'Unread messages')).toBe(false)
  })

  it('warns owner about low collection after day 10', () => {
    const day = new Date().getDate()
    if (day < 10) return
    const ctx = {
      ...baseCtx,
      buildings: [{ id: 'b1' }],
      units: [{ id: 'u1', status: 'occupied' }],
      tenants: [{ id: 't1', status: 'Active', rentAmount: 1_000_000 }],
      payments: [{ type: 'rent', amount: 100_000, date: new Date().toISOString() }],
    }
    runAutoNotifications(ctx)
    expect(getNotifications().some((n) => n.title === 'Low rent collection')).toBe(true)
  })
})
