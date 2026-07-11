import React from 'react'
import { Heart, Gift, Info } from 'lucide-react'
import { DISCOVER_STRIP_LINKS } from '../lib/navigation'

export default function DiscoverStrip({ currentRole, setCurrentPage, currentPage }) {
  const links = DISCOVER_STRIP_LINKS.filter((l) => l.roles.includes(currentRole))
  if (!links.length) return null

  return (
    <div className="bg-brand/5 dark:bg-brand/10 border-b border-brand/15 px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="text-gray-600 dark:text-gray-300 font-medium shrink-0 hidden sm:inline">
        Discover
      </span>
      {links.map(({ id, label, blurb, icon }) => {
        const Icon = icon === 'gift' ? Gift : icon === 'heart' ? Heart : Info
        const active = currentPage === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setCurrentPage(id)}
            className={`tap-target inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              active
                ? 'bg-brand text-white'
                : 'text-brand hover:bg-brand/10 dark:hover:bg-brand/20'
            }`}
            title={blurb}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        )
      })}
      {currentRole === 'property_owner' && (
        <span className="text-gray-500 dark:text-gray-400 ml-auto hidden md:inline">
          Tenants join free · you manage everything in one place
        </span>
      )}
    </div>
  )
}
