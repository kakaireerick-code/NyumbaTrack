import React from 'react'
import { Home, CreditCard, FileText, HelpCircle, MessageCircle } from 'lucide-react'

const TABS = [
  { id: 'my-balance', label: 'Home', icon: Home },
  { id: 'my-payments', label: 'Pay', icon: CreditCard },
  { id: 'my-messages', label: 'Messages', icon: MessageCircle },
  { id: 'my-lease', label: 'Lease', icon: FileText },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

export default function TenantBottomNav({ currentPage, setCurrentPage }) {
  return (
    <>
      {/* Desktop: simple top tab bar */}
      <nav
        className="hidden md:flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 gap-1"
        aria-label="Tenant menu"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active =
            currentPage === id ||
            (id === 'my-balance' && (currentPage === 'my-receipts' || currentPage === 'guided' || currentPage === 'assistant'))
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCurrentPage(id)}
              className={`tap-target flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-brand'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Mobile: bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden safe-area-pb"
        aria-label="Tenant menu"
      >
        <div className="flex justify-around items-stretch h-[4.25rem]">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active =
              currentPage === id ||
              (id === 'my-balance' && currentPage === 'my-receipts')
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCurrentPage(id)}
                className={`tap-target flex flex-col items-center justify-center flex-1 min-w-0 py-1 gap-0.5 ${
                  active ? 'text-brand font-semibold' : 'text-gray-500'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] truncate w-full text-center">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
