import React from 'react'
import { Icon } from './UI'

export default function Header({ currentUser, theme, setTheme, sidebarOpen, setSidebarOpen, showBrandingBanner }) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <button type="button" className="md:hidden p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Icon name="Menu" size={24} />
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
          {currentUser?.name || 'User'}
          {currentUser?.building ? ` — ${currentUser.building}` : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Toggle theme"
      >
        {theme === 'light' ? '☀️' : '🌙'}
      </button>
      {showBrandingBanner && (
        <span className="text-xs text-orange-600 hidden lg:inline">Complete branding in Settings</span>
      )}
    </header>
  )
}
