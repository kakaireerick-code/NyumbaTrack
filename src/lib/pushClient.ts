const PUSH_PREFS_KEY = (userId: string) => `rt_push_prefs_${userId}`

export type PushPrefs = {
  enabled: boolean
  closedApp: boolean
}

export type PushBrowser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'other'

export type PushCapabilities = {
  notifications: boolean
  serviceWorker: boolean
  pushManager: boolean
  standalone: boolean
  isIOS: boolean
  isAndroid: boolean
  browser: PushBrowser
  tabHiddenSupported: boolean
  closedAppSupported: boolean
  hint: string
}

const defaultPrefs = (): PushPrefs => ({ enabled: false, closedApp: true })

const detectBrowser = (ua: string): PushBrowser => {
  if (/SamsungBrowser/i.test(ua)) return 'samsung'
  if (/Firefox/i.test(ua)) return 'firefox'
  if (/Edg/i.test(ua)) return 'edge'
  if (/Chrome/i.test(ua)) return 'chrome'
  if (/Safari/i.test(ua)) return 'safari'
  return 'other'
}

const isStandalonePwa = (): boolean => {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const standaloneMedia =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  return standaloneMedia || nav.standalone === true
}

export const getPushCapabilities = (): PushCapabilities => {
  if (typeof window === 'undefined') {
    return {
      notifications: false,
      serviceWorker: false,
      pushManager: false,
      standalone: false,
      isIOS: false,
      isAndroid: false,
      browser: 'other',
      tabHiddenSupported: false,
      closedAppSupported: false,
      hint: 'Notifications unavailable in this context.',
    }
  }

  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(ua)
  const standalone = isStandalonePwa()
  const notifications = 'Notification' in window
  const serviceWorker = 'serviceWorker' in navigator
  const pushManager = serviceWorker && 'PushManager' in window
  const browser = detectBrowser(ua)

  const tabHiddenSupported = notifications
  const closedAppSupported = Boolean(pushManager && (!isIOS || standalone))

  let hint = ''
  if (!notifications) {
    hint = 'This browser does not support notifications. Try Chrome, Firefox, Edge, or Safari.'
  } else if (isIOS && !standalone) {
    hint = 'iPhone/iPad: Safari → Share → Add to Home Screen, then open the app icon and enable notifications.'
  } else if (!pushManager) {
    hint = 'Tab-hidden alerts work here. For closed-app push use Chrome, Firefox, Edge, or Safari 16+.'
  } else if (browser === 'firefox' && isAndroid) {
    hint = 'Firefox Android: allow notifications when prompted.'
  }

  return {
    notifications,
    serviceWorker,
    pushManager,
    standalone,
    isIOS,
    isAndroid,
    browser,
    tabHiddenSupported,
    closedAppSupported,
    hint,
  }
}

export const getPushPrefs = (userId: string): PushPrefs => {
  try {
    const raw = localStorage.getItem(PUSH_PREFS_KEY(userId))
    if (!raw) return defaultPrefs()
    return { ...defaultPrefs(), ...JSON.parse(raw) }
  } catch {
    return defaultPrefs()
  }
}

export const savePushPrefs = (userId: string, prefs: PushPrefs): void => {
  localStorage.setItem(PUSH_PREFS_KEY(userId), JSON.stringify(prefs))
}

/** True when tab-hidden OS notifications are available (all modern browsers). */
export const isPushSupported = (): boolean => getPushCapabilities().tabHiddenSupported

/** True when Web Push subscription can work (browser + PWA rules). */
export const isClosedAppPushSupported = (): boolean => getPushCapabilities().closedAppSupported

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/push-vapid')
    const data = await res.json()
    return res.ok && data.publicKey ? String(data.publicKey) : null
  } catch {
    return null
  }
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

const enableTabOnlyPush = async (userId: string): Promise<{ ok: boolean; error?: string }> => {
  if (!('Notification' in window)) {
    return { ok: false, error: 'Notifications not supported on this browser' }
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied' }
  }
  await registerServiceWorker()
  savePushPrefs(userId, { enabled: true, closedApp: false })
  return { ok: true }
}

export const subscribeDevicePush = async (
  ownerId: string,
  role: string,
  userId: string,
): Promise<{ ok: boolean; error?: string; mode?: 'tab' | 'pwa' }> => {
  const caps = getPushCapabilities()

  if (!caps.tabHiddenSupported) {
    return { ok: false, error: caps.hint || 'Notifications not supported on this browser' }
  }

  if (caps.isIOS && !caps.standalone) {
    return { ok: false, error: caps.hint }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied' }
  }

  if (!caps.closedAppSupported) {
    const tab = await enableTabOnlyPush(userId)
    return tab.ok
      ? { ok: true, mode: 'tab' }
      : { ok: false, error: tab.error || 'Could not enable tab notifications' }
  }

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) {
    await registerServiceWorker()
    savePushPrefs(userId, { enabled: true, closedApp: false })
    return { ok: true, mode: 'tab' }
  }

  const reg = (await registerServiceWorker()) || (await navigator.serviceWorker.ready)
  if (!reg?.pushManager) {
    savePushPrefs(userId, { enabled: true, closedApp: false })
    return { ok: true, mode: 'tab' }
  }

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    } catch (err) {
      savePushPrefs(userId, { enabled: true, closedApp: false })
      const msg = err instanceof Error ? err.message : 'Push subscribe failed'
      return { ok: true, mode: 'tab', error: `${msg} — tab-hidden alerts still work.` }
    }
  }

  const res = await fetch('/api/push-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId,
      role,
      userId,
      subscription: sub.toJSON(),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    savePushPrefs(userId, { enabled: true, closedApp: false })
    return {
      ok: true,
      mode: 'tab',
      error: data.error ? `${data.error} — tab-hidden alerts still work.` : undefined,
    }
  }

  savePushPrefs(userId, { enabled: true, closedApp: true })
  return { ok: true, mode: 'pwa' }
}

export const unsubscribeDevicePush = async (userId: string): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    savePushPrefs(userId, { enabled: false, closedApp: false })
    return
  }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager?.getSubscription()
    if (sub) {
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
  savePushPrefs(userId, { enabled: false, closedApp: false })
}

export const setClosedAppPush = (userId: string, closedApp: boolean): void => {
  const prefs = getPushPrefs(userId)
  savePushPrefs(userId, { ...prefs, closedApp })
}

export const showLocalNotification = async (
  title: string,
  body: string,
  url = '/',
): Promise<void> => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!document.hidden) return

  const opts: NotificationOptions = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'nyumba-local',
    data: { url },
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg.showNotification) {
        await reg.showNotification(title, opts)
        return
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const n = new Notification(title, opts)
    n.onclick = () => {
      window.focus()
      if (url && url !== '/') window.location.href = url
      n.close()
    }
  } catch {
    /* ignore */
  }
}
