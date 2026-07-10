import React, { useState } from 'react'
import { Plus } from 'lucide-react'

export default function QuickActions({ setCurrentPage, onRecordPayment, onAddTenant, onLogMaintenance, onSendReminder }) {
  const [open, setOpen] = useState(false)

  const actions = [
    { label: 'Record Payment', fn: () => { setCurrentPage('payments'); onRecordPayment?.(); setOpen(false) } },
    { label: 'Add Tenant', fn: () => { setCurrentPage('tenants'); onAddTenant?.(); setOpen(false) } },
    { label: 'Log Maintenance', fn: () => { setCurrentPage('maintenance'); onLogMaintenance?.(); setOpen(false) } },
    { label: 'Send Reminder', fn: () => { setCurrentPage('reminders'); onSendReminder?.(); setOpen(false) } },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 min-w-[180px]">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.fn}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#d62828] text-white shadow-lg flex items-center justify-center hover:bg-red-700"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}
