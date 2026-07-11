import React from 'react'
import { Icon } from './UI'
import { ROLE_LABELS, ROLE_BADGE_CLASS } from '../lib/rolePrompts'
import { normalizeRole } from '../lib/permissions'
import { DISCOVER_STRIP_LINKS } from '../lib/navigation'

export default function Header({
  currentUser,
  currentRole,
  theme,
  setTheme,
  sidebarOpen,
  setSidebarOpen,
  showBrandingBanner,
  demoMode,
  onToggleDemoMode,
  appModeLabel: modeLabel,
  onOpenGuide,
  onNavigate,
  currentPage,
  isTenant,
  unreadMessages,
  onOpenMessages,
  notificationInbox,
}) {
  const roleKey = normalizeRole(currentRole)
  const roleLabel = ROLE_LABELS[roleKey] || 'User'
  const badgeClass = ROLE_BADGE_CLASS[roleKey] || 'bg-gray-600 text-white'
  const isOwner = roleKey === 'property_owner'
  const discoverLinks = DISCOVER_STRIP_LINKS.filter((l) => l.roles.includes(roleKey))

  return (
    <>
      {demoMode && isOwner && (
        <div className="bg-yellow-400 text-yellow-900 text-center text-sm py-1.5 px-4 font-medium">
          {modeLabel || 'Training mode'} — sample property visible. Toggle off for live data.
        </div>
      )}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {!isTenant && (
            <button
              type="button"
              className="tap-target md:hidden p-1 shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open menu"
            >
              <Icon name="Menu" size={24} />
            </button>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline truncate">
            {currentUser?.name || 'User'}
            {currentUser?.building ? ` — ${currentUser.building}` : ''}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onNavigate &&
            discoverLinks.map(({ id, shortLabel, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`hidden sm:inline tap-target px-2 py-1.5 text-xs rounded-lg border ${
                  currentPage === id
                    ? 'bg-brand text-white border-brand'
                    : 'border-brand/30 text-brand hover:bg-brand/10'
                }`}
                title={label}
              >
                {shortLabel || (id === 'referrals' ? 'Rewards' : 'About')}
              </button>
            ))}
          {notificationInbox}
          {onOpenMessages && unreadMessages > 0 && (
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-2 py-1.5 text-xs rounded border border-red-300 text-red-700 bg-red-50"
              title="Unread tenant messages"
            >
              {unreadMessages} new
            </button>
          )}
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="tap-target px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand text-brand hover:bg-brand/10"
              title="Help and guided workflows"
            >
              My guide
            </button>
          )}
          {isOwner && onToggleDemoMode && (
            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`px-2 py-1.5 text-xs rounded border ${demoMode ? 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-600 dark:text-yellow-200' : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'}`}
              title="Practice with sample data"
            >
              Demo {demoMode ? 'ON' : 'OFF'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle theme"
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
          {showBrandingBanner && !isTenant && (
            <span className="text-xs text-orange-600 hidden lg:inline">Complete branding in Settings</span>
          )}
        </div>
      </header>
    </>
  )
}
