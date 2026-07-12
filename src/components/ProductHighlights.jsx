import React from 'react'
import {
  Gift,
  Shield,
  Smartphone,
  Clock,
  Heart,
  Users,
  Link2,
  Sparkles,
} from 'lucide-react'
import { highlightsFor } from '../lib/productHighlights'
import { normalizeRole } from '../lib/permissions'
import { APP_NAME } from '../lib/brand'

const ICONS = {
  trial: Clock,
  free: Heart,
  uganda: Sparkles,
  momo: Smartphone,
  referral: Gift,
  privacy: Shield,
  yearly: Gift,
  invite: Link2,
}

export default function ProductHighlights({
  currentRole,
  surface,
  setCurrentPage,
  variant = 'cards',
  title = 'Good to know',
  maxItems,
}) {
  const role = normalizeRole(currentRole)
  const items = highlightsFor(role, surface)
  const visible = maxItems ? items.slice(0, maxItems) : items
  if (!visible.length) return null

  if (variant === 'login') {
    return (
      <div className="mt-6 pt-5 border-t dark:border-gray-600 space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Why {APP_NAME}
        </p>
        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
          {visible.map((h) => (
            <li key={h.id} className="flex gap-2">
              <span className="text-brand shrink-0">✓</span>
              <span>
                <strong>{h.title}</strong> — {h.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="card p-3 border-l-4 border-brand/30 bg-brand/5 dark:bg-brand/10">
        <p className="text-xs font-semibold text-brand mb-1">{visible[0].title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-300">{visible[0].detail}</p>
        {setCurrentPage && visible[0].pageId && visible[0].ctaLabel && (
          <button
            type="button"
            onClick={() => setCurrentPage(visible[0].pageId)}
            className="mt-2 text-xs text-brand underline"
          >
            {visible[0].ctaLabel}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
        {visible.map((h) => {
          const Icon = ICONS[h.icon] || Sparkles
          const clickable = setCurrentPage && h.pageId
          return (
            <button
              key={h.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setCurrentPage(h.pageId)}
              title={h.detail}
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border ${
                clickable
                  ? 'border-brand/25 text-brand hover:bg-brand/10 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 cursor-default'
              }`}
            >
              <Icon size={11} />
              {h.title}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((h) => {
          const Icon = ICONS[h.icon] || Sparkles
          return (
            <div key={h.id} className="card p-4 flex gap-3">
              <Icon className="text-brand shrink-0 mt-0.5" size={20} />
              <div className="min-w-0">
                <p className="font-semibold text-sm">{h.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{h.detail}</p>
                {setCurrentPage && h.pageId && h.ctaLabel && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(h.pageId)}
                    className="mt-2 text-xs text-brand font-medium hover:underline"
                  >
                    {h.ctaLabel} →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
