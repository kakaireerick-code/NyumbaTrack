import { describe, it, expect, beforeEach } from 'vitest'
import {
  addNotification,
  getRoleSafeNotifications,
  getFilteredNotifications,
  saveNotificationPrefs,
} from './notifications'
import { filterPaymentsForRole } from './permissions'

describe('notifications', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redacts amounts from caretaker notification payloads', () => {
    addNotification({
      ownerId: 'owner-1',
      role: 'caretaker',
      title: 'Payment received UGX 500,000',
      body: 'Tenant paid rent amount 500000 for unit 2B',
      kind: 'payment',
    })
    const items = getRoleSafeNotifications('caretaker', 'owner-1')
    expect(items[0].title).not.toMatch(/500/)
    expect(items[0].body).not.toMatch(/500000/)
  })

  it('respects notification preferences by kind', () => {
    addNotification({
      ownerId: 'owner-1',
      role: 'property_owner',
      title: 'System update',
      body: 'Welcome',
      kind: 'system',
    })
    saveNotificationPrefs('property_owner', 'owner-1', {
      maintenance: true,
      messages: true,
      payments: true,
      system: false,
    })
    const items = getFilteredNotifications('property_owner', 'owner-1', 'owner-1')
    expect(items).toHaveLength(0)
  })
})

describe('caretaker payment filtering', () => {
  it('returns empty payments array for caretaker session views', () => {
    const payments = [{ id: 'p1', amount: 500000, tenantId: 't1' }]
    expect(filterPaymentsForRole('caretaker', payments)).toEqual([])
    expect(filterPaymentsForRole('property_owner', payments)).toEqual(payments)
  })
})