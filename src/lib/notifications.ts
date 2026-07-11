/**
 * Role-safe notification payloads — caretakers never receive amount fields.
 */
import { safeGet, safeSet } from './storage'
import { normalizeRole } from './permissions'
import type { Role } from './permissions'
import { dispatchPushForNotification } from './pushDispatch'

export type AppNotification = {
  id: string
  ownerId: string
  role: Role
  userId?: string
  title: string
  body: string
  createdAt: string
  read: boolean
  kind: 'maintenance' | 'message' | 'payment' | 'system'
  /** In-app page id when user taps the notification */
  actionPage?: string
}

const NOTIF_KEY = 'rt_role_notifications'

export const getNotifications = (): AppNotification[] =>
  safeGet<AppNotification[]>(NOTIF_KEY, [])

export const saveNotifications = (list: AppNotification[]): void =>
  safeSet(NOTIF_KEY, list)

export const addNotification = (
  n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { push?: boolean },
): void => {
  const record: AppNotification = {
    ...n,
    id: `n-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  }
  saveNotifications([...getNotifications(), record])
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rt-notifications-updated'))
  }
  if (n.push !== false) {
    dispatchPushForNotification(record, record.id)
  }
}

/** Strip amount references from caretaker notification bodies */
export const getRoleSafeNotifications = (
  role: string,
  ownerId: string,
  userId?: string,
): AppNotification[] => {
  const r = normalizeRole(role)
  return getNotifications().filter((n) => {
    if (n.ownerId !== ownerId) return false
    if (r === 'property_owner') return n.role === 'property_owner' || !n.userId
    if (r === 'tenant') return n.userId === userId || n.role === 'tenant'
    if (r === 'caretaker') return n.role === 'caretaker'
    return false
  }).map((n) => {
    if (r !== 'caretaker') return n
    const { title, body, ...rest } = n
    return {
      ...rest,
      title: title.replace(/UGX[\s\d,]+/gi, '[redacted]'),
      body: body.replace(/UGX[\s\d,]+/gi, '[redacted]').replace(/\d{3,}/g, '[redacted]'),
    }
  })
}

export const markNotificationRead = (id: string): void => {
  saveNotifications(getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export const unreadCountForRole = (
  role: string,
  ownerId: string,
  userId?: string,
): number =>
  getRoleSafeNotifications(role, ownerId, userId).filter((n) => !n.read).length

export type NotificationPrefs = {
  maintenance: boolean
  messages: boolean
  payments: boolean
  system: boolean
}

const PREFS_KEY = (role: string, userId: string) =>
  `rt_notif_prefs_${normalizeRole(role)}_${userId}`

const DEFAULT_PREFS: NotificationPrefs = {
  maintenance: true,
  messages: true,
  payments: true,
  system: true,
}

export const getNotificationPrefs = (role: string, userId: string): NotificationPrefs =>
  safeGet<NotificationPrefs>(PREFS_KEY(role, userId), DEFAULT_PREFS)

export const saveNotificationPrefs = (
  role: string,
  userId: string,
  prefs: NotificationPrefs,
): void => safeSet(PREFS_KEY(role, userId), prefs)

export const getFilteredNotifications = (
  role: string,
  ownerId: string,
  userId?: string,
): AppNotification[] => {
  const prefs = getNotificationPrefs(role, userId || ownerId)
  return getRoleSafeNotifications(role, ownerId, userId).filter((n) => {
    if (n.kind === 'maintenance') return prefs.maintenance
    if (n.kind === 'message') return prefs.messages
    if (n.kind === 'payment') return prefs.payments
    return prefs.system
  })
}

/** Cross-tab sync via storage event */
export const subscribeNotificationUpdates = (onUpdate: () => void): (() => void) => {
  const handler = () => onUpdate()
  window.addEventListener('rt-notifications-updated', handler)
  window.addEventListener('storage', (e) => {
    if (e.key === NOTIF_KEY) onUpdate()
  })
  return () => window.removeEventListener('rt-notifications-updated', handler)
}
