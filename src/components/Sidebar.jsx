import React from 'react'
import { pagesForRole, normalizeRole } from '../lib/permissions'
import { sidebarPagesForRole } from '../lib/navigation'
import { Icon } from './UI'

const PAGE_META = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard' },
  buildings: { label: 'Properties', icon: 'Building2' },
  units: { label: 'Units', icon: 'DoorOpen' },
  vacancy: { label: 'Vacancies', icon: 'Grid3x3' },
  tenants: { label: 'Tenants', icon: 'Users' },
  'lease-manager': { label: 'Leases', icon: 'FileText' },
  payments: { label: 'Payments', icon: 'CreditCard' },
  'balance-tracker': { label: 'Rent Ledger', icon: 'Scale' },
  deposits: { label: 'Deposits', icon: 'Wallet' },
  utilities: { label: 'Utilities', icon: 'Zap' },
  reminders: { label: 'Reminders', icon: 'Bell' },
  maintenance: { label: 'Repairs', icon: 'Wrench' },
  reports: { label: 'Reports', icon: 'BarChart3' },
  documents: { label: 'Documents', icon: 'FolderOpen' },
  'legal-notices': { label: 'Legal', icon: 'Gavel' },
  settings: { label: 'Settings', icon: 'Settings' },
  subscription: { label: 'Billing', icon: 'CreditCard' },
  blacklist: { label: 'Blacklist', icon: 'Ban' },
  'defaulter-list': { label: 'Defaulters', icon: 'AlertTriangle' },
  help: { label: 'Help', icon: 'HelpCircle' },
  guided: { label: 'Guided Steps', icon: 'ListChecks' },
  assistant: { label: 'Assistant', icon: 'MessageCircle' },
  messages: { label: 'Inbox', icon: 'MessageCircle' },
  'data-import': { label: 'Import', icon: 'FileSpreadsheet' },
}

export default function Sidebar({ currentRole, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) {
  const role = normalizeRole(currentRole)
  const allPages = pagesForRole(role)
  const pageIds = sidebarPagesForRole(role, allPages)
  const items = pageIds
    .filter((id) => PAGE_META[id])
    .map((id) => ({ id, ...PAGE_META[id] }))

  if (role === 'tenant') return null

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed md:static z-40 h-full w-[240px] flex-shrink-0 transition-transform duration-200 bg-brand-dark ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center gap-2 text-white border-b border-white/10">
          <Icon name="Home" size={26} className="text-brand-light" />
          <span className="font-bold text-base leading-tight">NyumbaTrack</span>
        </div>
        <nav className="p-3 overflow-y-auto max-h-[calc(100vh-80px)]" aria-label="Main menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              data-nav-id={item.id}
              onClick={() => {
                setCurrentPage(item.id)
                if (window.innerWidth <= 768) setSidebarOpen(false)
              }}
              className={`tap-target w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-left mb-1 transition-colors ${
                currentPage === item.id
                  ? 'bg-brand text-white font-semibold shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
