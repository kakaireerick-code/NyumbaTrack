import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPaymentSettingsByOwner,
  savePaymentSettingsByOwner,
  mergeOwnerSettings,
  splitSettingsUpdate,
  migrateGlobalPaymentSettings,
  PAYMENT_SETTING_KEYS,
} from './ownerSettings'

const globalSettings = {
  mtnMomo: '+256 770 111 111',
  airtelMoney: '+256 750 111 111',
  bankAccount: '',
  managerName: 'Global Manager',
}

describe('ownerSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores payment numbers per owner', () => {
    savePaymentSettingsByOwner({
      'owner-a': { mtnMomo: '+256 700 100 100', airtelMoney: '+256 700 200 200' },
      'owner-b': { mtnMomo: '+256 701 100 100' },
    })
    expect(getPaymentSettingsByOwner()['owner-a'].mtnMomo).toBe('+256 700 100 100')
    expect(getPaymentSettingsByOwner()['owner-b'].airtelMoney).toBeUndefined()
  })

  it('merges global settings with owner payment overrides', () => {
    savePaymentSettingsByOwner({ 'owner-a': { mtnMomo: '+256 700 999 999' } })
    const merged = mergeOwnerSettings(globalSettings, 'owner-a')
    expect(merged.mtnMomo).toBe('+256 700 999 999')
    expect(merged.managerName).toBe('Global Manager')
  })

  it('uses training numbers in demo mode without persisting', () => {
    savePaymentSettingsByOwner({ 'owner-a': { mtnMomo: '+256 700 111 222' } })
    const demo = mergeOwnerSettings(globalSettings, 'owner-a', { demoMode: true })
    expect(demo.mtnMomo).toBe('+256 700 000 100')
    expect(getPaymentSettingsByOwner()['owner-a'].mtnMomo).toBe('+256 700 111 222')
  })

  it('splits payment vs global setting updates', () => {
    const prev = { ...globalSettings, managerName: 'Old' }
    const next = { ...globalSettings, mtnMomo: '+256 799 000 000', managerName: 'New' }
    const { paymentPatch, globalPatch } = splitSettingsUpdate(prev, next)
    expect(paymentPatch.mtnMomo).toBe('+256 799 000 000')
    expect(globalPatch.managerName).toBe('New')
    expect(globalPatch.mtnMomo).toBeUndefined()
  })

  it('migrates legacy global payment fields to demo owner once', () => {
    const migrated = migrateGlobalPaymentSettings(globalSettings, 'u-owner-demo')
    expect(migrated['u-owner-demo'].mtnMomo).toBe('+256 770 111 111')
    expect(migrateGlobalPaymentSettings(globalSettings, 'u-owner-demo')).toEqual(migrated)
  })

  it('exposes payment setting keys for UI wiring', () => {
    expect(PAYMENT_SETTING_KEYS).toContain('mtnMomo')
    expect(PAYMENT_SETTING_KEYS).toContain('bankAccount')
  })
})
