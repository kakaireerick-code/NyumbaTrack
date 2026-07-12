import { safeGet, safeSet } from './storage'
import { DEMO_TRAINING_PAYMENT_NUMBERS } from './demoLiveSeparation'

export type OwnerPaymentSettings = {
  mtnMomo?: string
  airtelMoney?: string
  bankAccount?: string
}

export type AppSettings = Record<string, unknown> & OwnerPaymentSettings

const PAYMENT_SETTINGS_KEY = 'rt_payment_settings_by_owner'

export const PAYMENT_SETTING_KEYS = ['mtnMomo', 'airtelMoney', 'bankAccount'] as const

export const getPaymentSettingsByOwner = (): Record<string, OwnerPaymentSettings> =>
  safeGet<Record<string, OwnerPaymentSettings>>(PAYMENT_SETTINGS_KEY, {})

export const savePaymentSettingsByOwner = (
  map: Record<string, OwnerPaymentSettings>,
): void => safeSet(PAYMENT_SETTINGS_KEY, map)

export const getOwnerPaymentSettings = (ownerId: string): OwnerPaymentSettings =>
  getPaymentSettingsByOwner()[ownerId] || {}

export const mergeOwnerSettings = (
  globalSettings: AppSettings,
  ownerId: string | null | undefined,
  opts?: { demoMode?: boolean; paymentByOwner?: Record<string, OwnerPaymentSettings> },
): AppSettings => {
  const ownerPayment = ownerId
    ? opts?.paymentByOwner?.[ownerId] ?? getOwnerPaymentSettings(ownerId)
    : {}
  const merged: AppSettings = {
    ...globalSettings,
    ...ownerPayment,
  }
  if (opts?.demoMode) {
    return { ...merged, ...DEMO_TRAINING_PAYMENT_NUMBERS }
  }
  return merged
}

export const splitSettingsUpdate = (
  prevMerged: AppSettings,
  nextMerged: AppSettings,
): { paymentPatch: OwnerPaymentSettings; globalPatch: Partial<AppSettings> } => {
  const paymentPatch: OwnerPaymentSettings = {}
  const globalPatch: Partial<AppSettings> = {}

  for (const [key, value] of Object.entries(nextMerged)) {
    if ((PAYMENT_SETTING_KEYS as readonly string[]).includes(key)) {
      if (prevMerged[key] !== value) paymentPatch[key as keyof OwnerPaymentSettings] = value as string
    } else if (prevMerged[key] !== value) {
      globalPatch[key] = value
    }
  }

  return { paymentPatch, globalPatch }
}

export const migrateGlobalPaymentSettings = (
  globalSettings: AppSettings,
  ownerId: string,
): Record<string, OwnerPaymentSettings> => {
  const existing = getPaymentSettingsByOwner()
  if (existing[ownerId]) return existing
  const hasPayment =
    !!String(globalSettings.mtnMomo || '').trim() ||
    !!String(globalSettings.airtelMoney || '').trim() ||
    !!String(globalSettings.bankAccount || '').trim()
  if (!hasPayment) return existing
  return {
    ...existing,
    [ownerId]: {
      mtnMomo: String(globalSettings.mtnMomo || ''),
      airtelMoney: String(globalSettings.airtelMoney || ''),
      bankAccount: String(globalSettings.bankAccount || ''),
    },
  }
}
