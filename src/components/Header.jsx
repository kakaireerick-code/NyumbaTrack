import React from 'react'
import { Icon } from './UI'
import { ROLE_LABELS, ROLE_BADGE_CLASS } from '../lib/rolePrompts'
import { normalizeRole } from '../lib/permissions'

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
  onOpenGuide,
  isTenant,
}) {
  const roleKey = currentRole === 'admin' ? 'property_owner' : currentRole === 'caretaker' ? 'housekeeper' : currentRole
  const roleLabel = ROLE_LABELS[roleKey] || ROLE_LABELS[currentRole] || 'User'
  const badgeClass = ROLE_BADGE_CLASS[roleKey] || ROLE_BADGE_CLASS[currentRole] || 'bg-gray-600 text-white'
  const isOwner = normalizeRole(roleKey) === 'property_owner'

  return (
    <>
      {demoMode && isOwner && (
        <div className="bg-yellow-400 text-yellow-900 text-center text-sm py-1.5 px-4 font-medium">
          Training mode — sample property &quot;Sample Apartments&quot; is visible. Toggle Demo Mode off for live data.
        </div>
      )}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" className="md:hidden p-1 shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name="Menu" size={24} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline truncate">
            {currentUser?.name || 'User'}
            {currentUser?.building ? ` — ${currentUser.building}` : ''}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="px-2 py-1.5 text-xs sm:text-sm rounded border border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10"
              title="Help and guided workflows"
            >
              My guide
            </button>
          )}
          {isOwner && onToggleDemoMode && (
            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`px-2 py-1.5 text-xs rounded border ${demoMode ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'border-gray-300 text-gray-600'}`}
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
