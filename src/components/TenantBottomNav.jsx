import React from 'react'
import { Home, CreditCard, FileText, HelpCircle } from 'lucide-react'

const TABS = [
  { id: 'my-balance', label: 'Home', icon: Home },
  { id: 'my-payments', label: 'Payments', icon: CreditCard },
  { id: 'my-lease', label: 'Lease', icon: FileText },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

export default function TenantBottomNav({ currentPage, setCurrentPage }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden safe-area-pb">
      <div className="flex justify-around items-stretch h-16">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id || (id === 'my-balance' && currentPage === 'my-receipts')
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCurrentPage(id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 gap-0.5 ${
                active ? 'text-[#2d6a4f]' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
