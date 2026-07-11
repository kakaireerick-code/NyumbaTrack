import { getPushPrefs } from './pushClient'
import type { Role } from './permissions'

export type PushTarget = {
  ownerId: string
  role: Role
  userId?: string
  title: string
  body: string
  url?: string
  tag?: string
}

export const sendRemotePush = async (target: PushTarget): Promise<void> => {
  if (typeof fetch === 'undefined') return
  const uid = target.userId || target.ownerId
  const prefs = getPushPrefs(uid)
  if (!prefs.enabled || !prefs.closedApp) return

  try {
    await fetch('/api/push-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: target.ownerId,
        role: target.role,
        userId: target.userId,
        title: target.title,
        body: target.body,
        url: target.url || '/',
        tag: target.tag,
      }),
    })
  } catch {
    /* non-blocking */
  }
}

export const dispatchPushForNotification = (
  n: {
    ownerId: string
    role: Role
    userId?: string
    title: string
    body: string
    actionPage?: string
  },
  tag?: string,
): void => {
  const userId = n.userId || (n.role === 'property_owner' ? n.ownerId : undefined)
  if (!userId && n.role !== 'property_owner') return

  const url = n.actionPage ? `/${n.actionPage}` : '/'

  if (typeof document !== 'undefined' && document.hidden) {
    import('./pushClient').then(({ showLocalNotification, getPushPrefs }) => {
      const prefs = getPushPrefs(userId || n.ownerId)
      if (prefs.enabled) showLocalNotification(n.title, n.body, url)
    })
  }

  void sendRemotePush({
    ownerId: n.ownerId,
    role: n.role,
    userId: n.role === 'property_owner' ? n.ownerId : n.userId,
    title: n.title,
    body: n.body,
    url,
    tag: tag || `n-${Date.now()}`,
  })
}
