import type { PageId } from './permissions'

/** Owner sidebar — 8 items only (see docs/UI-PREFERENCE.md) */
export const PRIMARY_SIDEBAR_PAGES: PageId[] = [
  'dashboard',
  'buildings',
  'units',
  'tenants',
  'payments',
  'deposits',
  'reports',
  'settings',
]

export type MoreToolLink = { id: PageId; label: string; description: string }

/** Advanced tools — reachable from Settings → More tools */
export const MORE_TOOLS_LINKS: MoreToolLink[] = [
  { id: 'subscription', label: 'Plans & Billing', description: 'MoMo subscription, yearly plans, invoices' },
  { id: 'billing-admin', label: 'Billing admin', description: 'Approve MoMo payments (admin email only)' },
  { id: 'data-import', label: 'Data Import', description: 'Excel/CSV/Word tenant import' },
  { id: 'guided', label: 'Guided Steps', description: 'Step-by-step workflows' },
  { id: 'assistant', label: 'Ask Assistant', description: 'In-app help assistant' },
  { id: 'vacancy', label: 'Vacancy Board', description: 'Unit availability overview' },
  { id: 'lease-manager', label: 'Lease Manager', description: 'Lease renewals and terms' },
  { id: 'balance-tracker', label: 'Rent Ledger', description: 'Balances and arrears' },
  { id: 'utilities', label: 'Utilities', description: 'Utility billing splits' },
  { id: 'reminders', label: 'Messages & Reminders', description: 'Tenant broadcasts' },
  { id: 'maintenance', label: 'Maintenance', description: 'Issue tracking' },
  { id: 'documents', label: 'Documents', description: 'House rules and templates' },
  { id: 'legal-notices', label: 'Legal Notices', description: 'Warnings and LC1 notices' },
  { id: 'blacklist', label: 'Blacklist', description: 'Tenant blacklist report' },
  { id: 'defaulter-list', label: 'Defaulters', description: 'Outstanding rent list' },
  { id: 'messages', label: 'Tenant Messages', description: 'Owner–tenant inbox' },
  { id: 'help', label: 'Help', description: 'Manuals and support' },
]

export const sidebarPagesForRole = (role: string, allPages: PageId[]): PageId[] => {
  if (role !== 'property_owner') return allPages
  return PRIMARY_SIDEBAR_PAGES.filter((id) => allPages.includes(id))
}
