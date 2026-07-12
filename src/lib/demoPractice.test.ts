import { describe, it, expect, beforeEach } from 'vitest'
import {
  ensureDemoPracticeData,
  isDemoPracticeSeeded,
  purgeDemoPracticeData,
  reconcileLiveNotifications,
} from './demoPractice'
import { getMessages } from './messages'
import { addNotification, getNotifications } from './notifications'
import { runAutoNotifications } from './autoNotifications'

describe('demoPractice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds sample messages and notifications once per owner when demo is on', () => {
    const ownerId = 'u-owner-demo'
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(true)
    expect(isDemoPracticeSeeded(ownerId)).toBe(true)
    expect(getMessages().length).toBeGreaterThan(0)
    expect(getNotifications().some((n) => n.title.startsWith('Practice:'))).toBe(true)
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(false)
  })

  it('does not seed when demo mode is off', () => {
    const ownerId = 'u-owner-live'
    expect(ensureDemoPracticeData(ownerId, { demoMode: false })).toBe(false)
    expect(getMessages()).toHaveLength(0)
    expect(getNotifications()).toHaveLength(0)
  })

  it('purges practice messages and notifications for owner', () => {
    const ownerId = 'u-owner-demo'
    ensureDemoPracticeData(ownerId, { demoMode: true })
    expect(getMessages().length).toBeGreaterThan(0)
    expect(getNotifications().some((n) => n.title.startsWith('Practice:'))).toBe(true)
    purgeDemoPracticeData(ownerId)
    expect(getMessages().filter((m) => m.ownerId === ownerId)).toHaveLength(0)
    expect(getNotifications().filter((n) => n.ownerId === ownerId && n.title.startsWith('Practice:'))).toHaveLength(0)
    expect(isDemoPracticeSeeded(ownerId)).toBe(false)
  })

  it('reconcileLiveNotifications removes phantom unread and demo banner alerts', () => {
    const ownerId = 'u-owner-live'
    addNotification({
      ownerId,
      role: 'property_owner',
      title: 'Unread messages',
      body: 'You have 2 unread tenant message(s).',
      kind: 'message',
      push: false,
    })
    addNotification({
      ownerId,
      role: 'property_owner',
      title: 'Demo mode is on',
      body: 'Switch to live mode when ready for real data.',
      kind: 'system',
      push: false,
    })
    addNotification({
      ownerId,
      role: 'property_owner',
      title: '2 vacant unit(s)',
      body: 'Share invite links to fill vacancies.',
      kind: 'system',
      push: false,
    })

    reconcileLiveNotifications({
      ownerId,
      buildings: [],
      units: [],
      tenants: [],
      payments: [],
      maintenance: [],
      unreadMessages: 0,
    })

    const titles = getNotifications()
      .filter((n) => n.ownerId === ownerId)
      .map((n) => n.title)
    expect(titles).not.toContain('Unread messages')
    expect(titles).not.toContain('Demo mode is on')
    expect(titles).not.toContain('2 vacant unit(s)')
  })

  it('purge with reconcile clears practice and phantom auto alerts', () => {
    const ownerId = 'u-owner-demo'
    ensureDemoPracticeData(ownerId, { demoMode: true })
    addNotification({
      ownerId,
      role: 'property_owner',
      title: 'Unread messages',
      body: 'You have 1 unread tenant message(s).',
      kind: 'message',
      push: false,
    })

    purgeDemoPracticeData(ownerId, {
      buildings: [],
      units: [],
      tenants: [],
      payments: [],
      maintenance: [],
      unreadMessages: 0,
    })

    const ownerAlerts = getNotifications().filter((n) => n.ownerId === ownerId)
    expect(ownerAlerts.some((n) => n.title.startsWith('Practice:'))).toBe(false)
    expect(ownerAlerts.some((n) => n.title === 'Unread messages')).toBe(false)
  })

  it('auto notifications skip unread owner alerts while demo mode is on', () => {
    runAutoNotifications({
      role: 'property_owner',
      ownerId: 'owner-demo',
      userId: 'owner-demo',
      buildings: [{ id: 'b1' }],
      units: [{ id: 'u1', status: 'occupied' }],
      tenants: [{ id: 't1', status: 'Active', rentAmount: 500000 }],
      payments: [],
      maintenance: [],
      subscription: { status: 'none', hasUsedTrial: false },
      settings: { mtnMomo: '+256700000000' },
      demoMode: true,
      unreadMessages: 3,
    })
    expect(getNotifications().some((n) => n.title === 'Unread messages')).toBe(false)
  })
})
