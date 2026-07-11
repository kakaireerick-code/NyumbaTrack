import React from 'react'
import { Heart, Gift, Info, CreditCard, HelpCircle } from 'lucide-react'
import { DISCOVER_STRIP_LINKS } from '../lib/navigation'
import ProductHighlights from './ProductHighlights'

const LINK_ICONS = {
  info: Info,
  gift: Gift,
  heart: Heart,
  card: CreditCard,
  help: HelpCircle,
}

export default function DiscoverStrip({ currentRole, setCurrentPage, currentPage }) {
  const links = DISCOVER_STRIP_LINKS.filter((l) => l.roles.includes(currentRole))
  if (!links.length) return null

  return (
    <div className="bg-brand/5 dark:bg-brand/10 border-b border-brand/15 px-3 py-2 space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-gray-600 dark:text-gray-300 font-medium shrink-0">Discover</span>
        {links.map(({ id, label, shortLabel, blurb, icon }) => {
          const Icon = LINK_ICONS[icon] || Info
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
              title={blurb || label}
            >
              <Icon size={13} />
              <span>{shortLabel || label}</span>
            </button>
          )
        })}
      </div>
      <ProductHighlights
        currentRole={currentRole}
        surface="discover"
        setCurrentPage={setCurrentPage}
        variant="pills"
      />
    </div>
  )
}
