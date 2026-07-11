import { describe, it, expect, beforeEach } from 'vitest'
import { postMessage, getMessages } from './messages'
import { getNotifications } from './notifications'

describe('messages inbox alerts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates owner bell alert when tenant posts', () => {
    postMessage({
      ownerId: 'owner-1',
      unitId: 'u1',
      tenantId: 't1',
      buildingId: 'b1',
      fromRole: 'tenant',
      authorName: 'Jane',
      body: 'Hello landlord',
    })
    expect(getMessages()).toHaveLength(1)
    expect(getNotifications().some((n) => n.kind === 'message' && n.role === 'property_owner')).toBe(true)
  })
})
