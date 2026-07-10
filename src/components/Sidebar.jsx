import React from 'react'
import { pagesForRole, normalizeRole } from '../lib/permissions'
import { Icon } from './UI'

const PAGE_META = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard' },
  buildings: { label: 'Properties', icon: 'Building2' },
  units: { label: 'Units', icon: 'DoorOpen' },
  vacancy: { label: 'Vacancy Board', icon: 'Grid3x3' },
  tenants: { label: 'Tenants', icon: 'Users' },
  'lease-manager': { label: 'Lease Manager', icon: 'FileText' },
  payments: { label: 'Payments', icon: 'CreditCard' },
  'balance-tracker': { label: 'Rent Ledger', icon: 'Scale' },
  deposits: { label: 'Deposits', icon: 'Wallet' },
  utilities: { label: 'Utilities', icon: 'Zap' },
  reminders: { label: 'Messages', icon: 'Bell' },
  maintenance: { label: 'Maintenance', icon: 'Wrench' },
  reports: { label: 'Reports', icon: 'BarChart3' },
  documents: { label: 'Documents', icon: 'FolderOpen' },
  'legal-notices': { label: 'Legal Notices', icon: 'Gavel' },
  settings: { label: 'Settings', icon: 'Settings' },
  subscription: { label: 'Plans & Billing', icon: 'CreditCard' },
  blacklist: { label: 'Blacklist', icon: 'Ban' },
  'defaulter-list': { label: 'Defaulters', icon: 'AlertTriangle' },
  'tenant-preview': { label: 'Tenant Preview', icon: 'Eye' },
  help: { label: 'Help', icon: 'HelpCircle' },
  guided: { label: 'Guided Steps', icon: 'ListChecks' },
  assistant: { label: 'Ask Assistant', icon: 'MessageCircle' },
  'data-import': { label: 'Data Import', icon: 'FileSpreadsheet' },
}

const ROLE_ALIASES = {
  admin: 'property_owner',
  property_owner: 'property_owner',
  caretaker: 'housekeeper',
  housekeeper: 'housekeeper',
  accountant: 'accountant',
  tenant: 'tenant',
}

export default function Sidebar({ currentRole, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) {
  const role = ROLE_ALIASES[currentRole] || normalizeRole(currentRole)
  const pageIds = pagesForRole(role)
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
        className={`fixed md:static z-40 h-full w-[220px] flex-shrink-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: '#1a2e1a' }}
      >
        <div className="p-4 flex items-center gap-2 text-white border-b border-white/10">
          <Icon name="Home" size={24} className="text-[#40916c]" />
          <span className="font-bold text-sm leading-tight">NyumbaTrack</span>
        </div>
        <nav className="p-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCurrentPage(item.id)
                if (window.innerWidth <= 768) setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded text-sm text-left mb-0.5 transition-colors ${
                currentPage === item.id ? 'bg-[#2d6a4f] text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
