import { safeGet, safeSet } from './storage'
import { DEMO_TENANTS, DEMO_UNITS, DEMO_BUILDINGS } from './demoData'
import { saveMessages, getMessages, type UnitMessage } from './messages'
import { addNotification, getNotifications, saveNotifications } from './notifications'
import { isDemoMessage, isPracticeNotification } from './demoLiveSeparation'

const MARKER_PREFIX = 'rt_demo_practice_seeded_v1'

export const isDemoPracticeSeeded = (ownerId: string): boolean =>
  safeGet(`${MARKER_PREFIX}_${ownerId}`, false) === true

const demoTenant = () => DEMO_TENANTS[0]
const demoUnit = () => DEMO_UNITS[0]
const demoBuilding = () => DEMO_BUILDINGS[0]

const seedMessages = (ownerId: string): void => {
  const tenant = demoTenant()
  const unit = demoUnit()
  const building = demoBuilding()
  const existing = getMessages().some((m) => m.ownerId === ownerId && m.tenantId === tenant.id)
  if (existing) return

  const base = {
    ownerId,
    unitId: unit.id,
    tenantId: tenant.id,
    buildingId: building.id,
  }

  const samples: Omit<UnitMessage, 'id' | 'createdAt' | 'readByOwner' | 'readByTenant'>[] = [
    {
      ...base,
      fromRole: 'tenant',
      authorName: `${tenant.firstName} ${tenant.lastName}`,
      body: 'Good morning — the kitchen tap is dripping again. Can someone look at it this week?',
      readByOwner: false,
      readByTenant: true,
    },
    {
      ...base,
      fromRole: 'owner',
      authorName: 'Landlord',
      body: 'Thanks for letting me know. I will send the caretaker tomorrow morning.',
      readByOwner: true,
      readByTenant: false,
    },
    {
      ...base,
      fromRole: 'tenant',
      authorName: `${tenant.firstName} ${tenant.lastName}`,
      body: 'Also, will the rent due date stay on the 5th next month?',
      readByOwner: false,
      readByTenant: true,
    },
  ]

  const stamped = samples.map((m, i) => ({
    ...m,
    id: `demo-msg-${ownerId}-${i}`,
    createdAt: new Date(Date.now() - (samples.length - i) * 3600000).toISOString(),
  }))
  saveMessages([...getMessages(), ...stamped])
}

const seedNotifications = (ownerId: string): void => {
  const tenant = demoTenant()
  const has = getNotifications().some(
    (n) => n.ownerId === ownerId && n.title.startsWith('Practice:'),
  )
  if (has) return

  const items = [
    {
      ownerId,
      role: 'property_owner' as const,
      title: 'Practice: new tenant message',
      body: 'Sample Tenant asked about a dripping tap — open Inbox to reply.',
      kind: 'message' as const,
      actionPage: 'messages',
      push: false,
    },
    {
      ownerId,
      role: 'property_owner' as const,
      title: 'Practice: rent reminder',
      body: 'Shop G1 is still vacant — invite a tenant from Settings when ready.',
      kind: 'system' as const,
      actionPage: 'settings',
      push: false,
    },
    {
      ownerId,
      role: 'tenant' as const,
      userId: tenant.id,
      title: 'Practice: message from landlord',
      body: 'Your landlord replied about the kitchen tap repair.',
      kind: 'message' as const,
      actionPage: 'my-messages',
      push: false,
    },
    {
      ownerId,
      role: 'caretaker' as const,
      title: 'Practice: maintenance check',
      body: 'Flat 2B reported a dripping tap — log it under Repairs when you visit.',
      kind: 'maintenance' as const,
      actionPage: 'maintenance',
      push: false,
    },
  ]

  for (const item of items) {
    addNotification(item)
  }
}

/** Load sample inbox + bell data for training. Idempotent per owner. */
export const ensureDemoPracticeData = (
  ownerId: string,
  opts?: { force?: boolean; demoMode?: boolean },
): boolean => {
  if (!ownerId) return false
  if (!opts?.demoMode) return false
  if (!opts?.force && isDemoPracticeSeeded(ownerId)) return false

  seedMessages(ownerId)
  seedNotifications(ownerId)
  safeSet(`${MARKER_PREFIX}_${ownerId}`, true)
  return true
}

/** Remove practice inbox messages and bell alerts when Demo is turned off. */
export const purgeDemoPracticeData = (ownerId: string): void => {
  if (!ownerId) return
  const ownerKey = String(ownerId)
  saveMessages(
    getMessages().filter((m) => !(String(m.ownerId) === ownerKey && isDemoMessage(m))),
  )
  saveNotifications(
    getNotifications().filter(
      (n) => !(String(n.ownerId) === ownerKey && isPracticeNotification(n)),
    ),
  )
  safeSet(`${MARKER_PREFIX}_${ownerId}`, false)
}
