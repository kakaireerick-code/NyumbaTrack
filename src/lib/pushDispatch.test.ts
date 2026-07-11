import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendRemotePush } from './pushDispatch'
import { savePushPrefs } from './pushClient'

describe('pushDispatch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('skips remote push when closed-app mode is off', async () => {
    savePushPrefs('owner-1', { enabled: true, closedApp: false })
    await sendRemotePush({
      ownerId: 'owner-1',
      role: 'property_owner',
      userId: 'owner-1',
      title: 'Test',
      body: 'Hello',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('posts to push-notify when closed-app push enabled', async () => {
    savePushPrefs('owner-1', { enabled: true, closedApp: true })
    await sendRemotePush({
      ownerId: 'owner-1',
      role: 'property_owner',
      userId: 'owner-1',
      title: 'Rent due',
      body: 'Pay today',
      url: '/my-balance',
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/push-notify',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
