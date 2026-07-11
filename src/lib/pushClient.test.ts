import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPushPrefs,
  savePushPrefs,
  urlBase64ToUint8Array,
  isPushSupported,
  isClosedAppPushSupported,
  getPushCapabilities,
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
    expect(typeof isClosedAppPushSupported()).toBe('boolean')
  })

  it('reports browser capabilities', () => {
    const caps = getPushCapabilities()
    expect(caps).toHaveProperty('browser')
    expect(caps).toHaveProperty('tabHiddenSupported')
    expect(caps).toHaveProperty('closedAppSupported')
    expect(caps).toHaveProperty('hint')
  })

  it('treats iOS Safari without standalone as closed-app unsupported', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      Notification: {},
      navigator: globalThis.navigator,
    })
    const caps = getPushCapabilities()
    expect(caps.isIOS).toBe(true)
    expect(caps.closedAppSupported).toBe(false)
    expect(caps.hint).toMatch(/Home Screen/i)
    vi.unstubAllGlobals()
  })
})
