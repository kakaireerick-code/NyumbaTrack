import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPushPrefs,
  savePushPrefs,
  urlBase64ToUint8Array,
  isPushSupported,
} from './pushClient'

describe('pushClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores push preferences per user', () => {
    savePushPrefs('user-1', { enabled: true, closedApp: false })
    expect(getPushPrefs('user-1')).toEqual({ enabled: true, closedApp: false })
    expect(getPushPrefs('user-2').enabled).toBe(false)
  })

  it('decodes url-safe base64 VAPID keys', () => {
    const bytes = urlBase64ToUint8Array('AQID')
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('detects push support in jsdom', () => {
    expect(typeof isPushSupported()).toBe('boolean')
  })
})
