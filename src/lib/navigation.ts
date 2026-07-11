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

/** Caretaker sidebar — 5 essentials only */
export const PRIMARY_CARETAKER_PAGES: PageId[] = [
  'units',
  'maintenance',
  'tenants',
  'vacancy',
  'help',
]

export type MoreToolLink = { id: PageId; label: string; description: string }

export type DiscoverStripLink = {
  id: PageId
  label: string
  shortLabel: string
  blurb: string
  icon: 'info' | 'gift' | 'heart' | 'card' | 'help'
  roles: Array<'property_owner' | 'tenant' | 'caretaker'>
}

/** Prominent header strip — marketing + product info (not buried in Settings) */
export const DISCOVER_STRIP_LINKS: DiscoverStripLink[] = [
  {
    id: 'about',
    label: 'About NyumbaTrack',
    shortLabel: 'About',
    blurb: 'What this app is and who it is for',
    icon: 'info',
    roles: ['property_owner', 'tenant', 'caretaker'],
  },
  {
    id: 'referrals',
    label: 'Partner Rewards',
    shortLabel: 'Rewards',
    blurb: 'Refer landlords — discounted billing months on first login',
    icon: 'gift',
    roles: ['property_owner'],
  },
  {
    id: 'subscription',
    label: 'Plans & Billing',
    shortLabel: 'Plans',
    blurb: '14-day trial, MoMo billing, yearly savings',
    icon: 'card',
    roles: ['property_owner'],
  },
  {
    id: 'help',
    label: 'Help & guides',
    shortLabel: 'Help',
    blurb: 'Manuals, tours, and step-by-step workflows',
    icon: 'help',
    roles: ['property_owner', 'tenant', 'caretaker'],
  },
]

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
  { id: 'about', label: 'About', description: 'What NyumbaTrack is and who it is for' },
  { id: 'referrals', label: 'Partner Rewards', description: 'Refer landlords — earn discounted billing months on first login' },
]

export type MoreToolsGroup = { title: string; ids: PageId[] }

/** Grouped for Settings → More tools (easier to scan) */
export const MORE_TOOLS_GROUPS: MoreToolsGroup[] = [
  { title: 'Billing & money', ids: ['subscription', 'billing-admin', 'balance-tracker', 'utilities', 'defaulter-list'] },
  { title: 'Daily work', ids: ['vacancy', 'lease-manager', 'reminders', 'maintenance', 'messages', 'data-import'] },
  { title: 'Help', ids: ['guided', 'assistant', 'help', 'about'] },
  { title: 'Company', ids: ['referrals'] },
  { title: 'Documents & legal', ids: ['documents', 'legal-notices', 'blacklist'] },
]

/** Quick links below primary nav — Plans, Rewards, Messages, Help (not replacing 8 core items) */
export const SIDEBAR_QUICK_LINKS: Array<{ id: PageId; label: string }> = [
  { id: 'subscription', label: 'Plans' },
  { id: 'referrals', label: 'Rewards' },
  { id: 'messages', label: 'Messages' },
  { id: 'help', label: 'Help' },
]

export const sidebarPagesForRole = (role: string, allPages: PageId[]): PageId[] => {
  if (role === 'property_owner') {
    return PRIMARY_SIDEBAR_PAGES.filter((id) => allPages.includes(id))
  }
  if (role === 'caretaker') {
    return PRIMARY_CARETAKER_PAGES.filter((id) => allPages.includes(id))
  }
  return allPages
}
