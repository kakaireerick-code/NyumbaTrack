import React, { useEffect, useState } from 'react'
import { Bell, Smartphone } from 'lucide-react'
import {
  getFilteredNotifications,
  markNotificationRead,
  unreadCountForRole,
  subscribeNotificationUpdates,
  getNotificationPrefs,
  saveNotificationPrefs,
} from '../lib/notifications'
import {
  getPushPrefs,
  isPushSupported,
  setClosedAppPush,
  subscribeDevicePush,
  unsubscribeDevicePush,
} from '../lib/pushClient'

export default function NotificationInbox({
  role,
  ownerId,
  userId,
  showToast,
  setCurrentPage,
}) {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [prefs, setPrefs] = useState(() => getNotificationPrefs(role, userId || ownerId))
  const pushUserId = userId || ownerId
  const [pushPrefs, setPushPrefs] = useState(() => getPushPrefs(pushUserId))
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMsg, setPushMsg] = useState('')

  useEffect(() => {
    return subscribeNotificationUpdates(() => setTick((t) => t + 1))
  }, [])

  useEffect(() => {
    setPrefs(getNotificationPrefs(role, userId || ownerId))
    setPushPrefs(getPushPrefs(pushUserId))
  }, [role, ownerId, userId, tick, pushUserId])

  const items = getFilteredNotifications(role, ownerId, userId)
  const unread = unreadCountForRole(role, ownerId, userId)

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    saveNotificationPrefs(role, userId || ownerId, next)
    showToast?.('Notification preferences saved', 'success')
  }

  const openItem = (n) => {
    markNotificationRead(n.id)
    setTick((t) => t + 1)
    if (n.actionPage && setCurrentPage) {
      setCurrentPage(n.actionPage)
      setOpen(false)
    }
  }

  const enablePhone = async () => {
    setPushBusy(true)
    setPushMsg('')
    const r = await subscribeDevicePush(ownerId, role, pushUserId)
    setPushPrefs(getPushPrefs(pushUserId))
    setPushMsg(r.ok ? 'Phone notifications enabled.' : r.error || 'Could not enable.')
    setPushBusy(false)
  }

  const toggleClosedApp = async (on) => {
    setPushBusy(true)
    setPushMsg('')
    if (on) {
      const r = await subscribeDevicePush(ownerId, role, pushUserId)
      setPushMsg(r.ok ? 'PWA push enabled.' : r.error || 'Enable failed.')
    } else {
      setClosedAppPush(pushUserId, false)
      setPushMsg('Closed-app push turned off (tab notifications still work).')
    }
    setPushPrefs(getPushPrefs(pushUserId))
    setPushBusy(false)
  }

  const supported = isPushSupported()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-600 text-white rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
              <span className="font-semibold text-sm">Notifications</span>
              <span className="text-xs text-gray-500">{unread} unread</span>
            </div>

            {supported && (
              <div className="px-3 py-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-2">
                <button
                  type="button"
                  disabled={pushBusy || pushPrefs.enabled}
                  onClick={enablePhone}
                  className="w-full text-left text-xs flex items-center gap-2 px-2 py-2 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-60"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {pushPrefs.enabled ? 'Phone notifications on' : 'Enable phone notifications'}
                  </span>
                </button>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushPrefs.closedApp}
                    disabled={pushBusy || !pushPrefs.enabled}
                    onChange={(e) => toggleClosedApp(e.target.checked)}
                  />
                  When app is closed (PWA)
                </label>
                {pushPrefs.enabled && (
                  <button
                    type="button"
                    className="text-[10px] text-red-600 hover:underline px-1"
                    disabled={pushBusy}
                    onClick={async () => {
                      setPushBusy(true)
                      await unsubscribeDevicePush(pushUserId)
                      setPushPrefs(getPushPrefs(pushUserId))
                      setPushMsg('Phone notifications disabled.')
                      setPushBusy(false)
                    }}
                  >
                    Turn off phone notifications
                  </button>
                )}
                {pushMsg && <p className="text-[11px] text-gray-600 dark:text-gray-400 px-1">{pushMsg}</p>}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
              ) : (
                items.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openItem(n)}
                    className={`w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${n.read ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                    {n.actionPage && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Tap to open</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t dark:border-gray-700 text-xs space-y-1">
              <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Preferences</p>
              {['maintenance', 'messages', 'payments', 'system'].map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={() => togglePref(key)}
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
