import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  getFilteredNotifications,
  markNotificationRead,
  unreadCountForRole,
  subscribeNotificationUpdates,
  getNotificationPrefs,
  saveNotificationPrefs,
} from '../lib/notifications'

export default function NotificationInbox({
  role,
  ownerId,
  userId,
  showToast,
}) {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [prefs, setPrefs] = useState(() => getNotificationPrefs(role, userId || ownerId))

  useEffect(() => {
    return subscribeNotificationUpdates(() => setTick((t) => t + 1))
  }, [])

  useEffect(() => {
    setPrefs(getNotificationPrefs(role, userId || ownerId))
  }, [role, ownerId, userId, tick])

  const items = getFilteredNotifications(role, ownerId, userId)
  const unread = unreadCountForRole(role, ownerId, userId)

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    saveNotificationPrefs(role, userId || ownerId, next)
    showToast?.('Notification preferences saved', 'success')
  }

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
            <div className="max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
              ) : (
                items.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id)
                      setTick((t) => t + 1)
                    }}
                    className={`w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${n.read ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
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
