import { describe, it, expect, beforeEach } from 'vitest'
import { postMessage, getThread, getMessages, countUnreadForTenant } from './messages'

describe('tenant messaging', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores thread with normalized string ids', () => {
    postMessage({
      ownerId: 'owner-1',
      unitId: 42,
      tenantId: 7,
      buildingId: 'b1',
      fromRole: 'tenant',
      authorName: 'Jane Tenant',
      body: 'Hello landlord',
    } as Parameters<typeof postMessage>[0])

    const thread = getThread('42', '7')
    expect(thread).toHaveLength(1)
    expect(thread[0].body).toBe('Hello landlord')
    expect(getMessages()[0].unitId).toBe('42')
    expect(getMessages()[0].tenantId).toBe('7')
  })

  it('matches thread when ids differ by type', () => {
    postMessage({
      ownerId: 'owner-1',
      unitId: 'u-100',
      tenantId: 't-200',
      buildingId: 'b1',
      fromRole: 'owner',
      authorName: 'Landlord',
      body: 'Reply here',
    })

    expect(getThread('u-100', 't-200')).toHaveLength(1)
    expect(countUnreadForTenant('t-200', 'u-100')).toBe(1)
  })

  it('rejects post without ownerId', () => {
    expect(() =>
      postMessage({
        ownerId: '',
        unitId: 'u1',
        tenantId: 't1',
        buildingId: 'b1',
        fromRole: 'tenant',
        authorName: 'Jane',
        body: 'Hi',
      }),
    ).toThrow('postMessage requires ownerId')
  })
})
