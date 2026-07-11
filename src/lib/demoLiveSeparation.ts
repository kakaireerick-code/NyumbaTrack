import type { Dispatch, SetStateAction } from 'react'

export const DEMO_ID_PREFIX = 'demo-'

export const isDemoId = (id: string | number | null | undefined): boolean =>
  !!id && String(id).startsWith(DEMO_ID_PREFIX)

type DemoTouchRecord = {
  id?: string | number | null
  buildingId?: string | number | null
  unitId?: string | number | null
  tenantId?: string | number | null
}

export const recordTouchesDemo = (record: DemoTouchRecord): boolean =>
  isDemoId(record.id) ||
  isDemoId(record.buildingId) ||
  isDemoId(record.unitId) ||
  isDemoId(record.tenantId)

export const introducesDemoTouch = <T extends DemoTouchRecord>(prev: T[], next: T[]): boolean => {
  const prevById = new Map(prev.map((item) => [String(item.id), item]))
  for (const item of next) {
    if (!recordTouchesDemo(item)) continue
    const old = prevById.get(String(item.id))
    if (!old || JSON.stringify(old) !== JSON.stringify(item)) return true
  }
  return false
}

export type ToastFn = (message: string, type?: string) => void

export const createGuardedSetter = <T extends DemoTouchRecord>(
  rawSetter: Dispatch<SetStateAction<T[]>>,
  demoMode: boolean,
  showToast: ToastFn,
  actionLabel: string,
): Dispatch<SetStateAction<T[]>> => {
  return (updater) => {
    if (!demoMode) {
      rawSetter(updater)
      return
    }
    rawSetter((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (introducesDemoTouch(prev, next)) {
        showToast(`Demo mode is read-only training — turn Demo OFF to ${actionLabel}.`, 'error')
        return prev
      }
      return next
    })
  }
}

export const isDemoMessage = (msg: {
  id?: string
  unitId?: string | number
  tenantId?: string | number
}): boolean =>
  String(msg.id || '').startsWith('demo-msg-') ||
  isDemoId(msg.unitId) ||
  isDemoId(msg.tenantId)

export const isPracticeNotification = (n: { title?: string }): boolean =>
  String(n.title || '').startsWith('Practice:')

export const DEMO_TRAINING_PAYMENT_NUMBERS = {
  mtnMomo: '+256 700 000 100',
  airtelMoney: '+256 700 000 200',
  bankAccount: 'Demo Bank — 0000000000 — Training Only',
}

export const filterOwnerMaintenance = <T extends { buildingId?: string; unitId?: string }>(
  rows: T[],
  ownerBuildingIds: Set<string>,
  ownerUnitIds: Set<string>,
): T[] =>
  rows.filter(
    (row) =>
      (row.buildingId && ownerBuildingIds.has(row.buildingId)) ||
      (row.unitId && ownerUnitIds.has(row.unitId)),
  )

export const filterOwnerUtilities = <T extends { buildingId?: string }>(
  rows: T[],
  ownerBuildingIds: Set<string>,
): T[] => rows.filter((row) => row.buildingId && ownerBuildingIds.has(row.buildingId))

export const paymentTouchesDemo = (payment: DemoTouchRecord): boolean => recordTouchesDemo(payment)
