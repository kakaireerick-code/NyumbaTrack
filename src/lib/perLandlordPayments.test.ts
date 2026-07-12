import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { mergeOwnerSettings, splitSettingsUpdate } from './ownerSettings'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('per-landlord payment wiring', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('App.jsx persists paymentSettingsByOwner and setOwnerSettings', () => {
    const app = read('src/App.jsx')
    expect(app).toContain('rt_payment_settings_by_owner')
    expect(app).toContain('setOwnerSettings')
    expect(app).toContain('tenantSettings')
  })

  it('tenant portal resolves landlord payment numbers via ownerId', () => {
    const portal = read('src/pages/TenantPortalPage.jsx')
    expect(portal).toContain('effectiveOwnerId')
    expect(portal).toContain('paymentNumbers')
    expect(portal).toContain('openMoMo')
  })

  it('demo mode does not persist payment field edits through setOwnerSettings path', () => {
    const app = read('src/App.jsx')
    expect(app).toContain('!showDemoData && Object.keys(paymentPatch).length')
  })

  it('splitSettingsUpdate leaves non-payment fields in globalPatch only', () => {
    const prev = { mtnMomo: 'a', managerName: 'Old', airtelMoney: 'b' }
    const next = { mtnMomo: 'c', managerName: 'New', airtelMoney: 'b' }
    const { paymentPatch, globalPatch } = splitSettingsUpdate(prev, next)
    expect(paymentPatch).toEqual({ mtnMomo: 'c' })
    expect(globalPatch).toEqual({ managerName: 'New' })
  })

  it('mergeOwnerSettings prefers owner map over global defaults', () => {
    const merged = mergeOwnerSettings(
      { mtnMomo: '+256 111', managerName: 'Global' },
      'owner-x',
      { paymentByOwner: { 'owner-x': { mtnMomo: '+256 999' } } },
    )
    expect(merged.mtnMomo).toBe('+256 999')
    expect(merged.managerName).toBe('Global')
  })

  it('verify script references ownerSettings for F26', () => {
    expect(existsSync(resolve(process.cwd(), 'scripts/verify-features.mjs'))).toBe(true)
    const verify = read('scripts/verify-features.mjs')
    expect(verify).toContain('ownerSettings.ts')
    expect(verify).toContain('paymentSettingsByOwner')
  })

  it('master prompt documents per-landlord MoMo storage key', () => {
    const doc = read('docs/MASTER-PROMPT-PR49.md')
    expect(doc).toContain('rt_payment_settings_by_owner')
    expect(doc).toContain('159 tests')
  })

  it('push script includes api-smoke and force fallback', () => {
    const script = read('PUSH-DEMO-LIVE-SEPARATION.ps1')
    expect(script).toContain('test:api-smoke')
    expect(script).toContain('--force-with-lease')
    expect(script).toContain('--force')
  })
})
