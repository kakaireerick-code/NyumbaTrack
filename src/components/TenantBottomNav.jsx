import React from 'react'
import { Home, CreditCard, FileText, HelpCircle, MessageCircle } from 'lucide-react'
import { countUnreadForTenant } from '../lib/messages'

const TABS = [
  { id: 'my-balance', label: 'Home', icon: Home },
  { id: 'my-payments', label: 'Pay', icon: CreditCard },
  { id: 'my-messages', label: 'Messages', icon: MessageCircle },
  { id: 'my-lease', label: 'Lease', icon: FileText },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

export default function TenantBottomNav({ currentPage, setCurrentPage, tenantId, unitId }) {
  const unread =
    tenantId && unitId ? countUnreadForTenant(String(tenantId), String(unitId)) : 0

  const renderTab = (id, label, Icon, active, mobile) => (
    <button
      key={id}
      type="button"
      onClick={() => setCurrentPage(id)}
      className={
        mobile
          ? `tap-target relative flex flex-col items-center justify-center flex-1 min-w-0 py-1 gap-0.5 ${
              active ? 'text-brand font-semibold' : 'text-gray-500'
            }`
          : `tap-target relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              active
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-brand'
            }`
      }
    >
      <span className="relative inline-flex">
        <Icon size={mobile ? 24 : 18} strokeWidth={active ? 2.5 : 2} />
        {id === 'my-messages' && unread > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      {mobile ? (
        <span className="text-[11px] truncate w-full text-center">{label}</span>
      ) : (
        label
      )}
    </button>
  )

  return (
    <>
      <nav
        className="hidden md:flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 gap-1 shrink-0"
        aria-label="Tenant menu"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active =
            currentPage === id ||
            (id === 'my-balance' && (currentPage === 'my-receipts' || currentPage === 'guided' || currentPage === 'assistant'))
          return renderTab(id, label, Icon, active, false)
        })}
      </nav>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden safe-area-pb shrink-0"
        aria-label="Tenant menu"
      >
        <div className="flex justify-around items-stretch h-[4.25rem]">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active =
              currentPage === id ||
              (id === 'my-balance' && currentPage === 'my-receipts')
            return renderTab(id, label, Icon, active, true)
          })}
        </div>
      </nav>
    </>
  )
}
