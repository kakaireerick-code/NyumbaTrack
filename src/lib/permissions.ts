export type AppRole = 'property_owner' | 'tenant' | 'housekeeper' | 'accountant'

export type PageId =
  | 'dashboard'
  | 'buildings'
  | 'units'
  | 'vacancy'
  | 'tenants'
  | 'lease-manager'
  | 'payments'
  | 'balance-tracker'
  | 'deposits'
  | 'utilities'
  | 'reminders'
  | 'maintenance'
  | 'reports'
  | 'documents'
  | 'legal-notices'
  | 'settings'
  | 'subscription'
  | 'blacklist'
  | 'defaulter-list'
  | 'tenant-preview'
  | 'help'
  | 'guided'
  | 'assistant'
  | 'data-import'
  | 'messages'
  | 'my-messages'
  | 'my-balance'
  | 'my-payments'
  | 'my-lease'
  | 'my-receipts'

export const normalizeRole = (role: string): AppRole => {
  if (role === 'admin' || role === 'property_owner') return 'property_owner'
  if (role === 'caretaker' || role === 'housekeeper') return 'housekeeper'
  if (role === 'accountant') return 'accountant'
  return 'tenant'
}

const OWNER_PAGES: PageId[] = [
  'dashboard', 'buildings', 'units', 'vacancy', 'tenants', 'lease-manager',
  'payments', 'balance-tracker', 'deposits', 'utilities', 'reminders',
  'maintenance', 'reports', 'documents', 'legal-notices', 'settings',
  'subscription', 'blacklist', 'defaulter-list', 'tenant-preview', 'help', 'guided', 'assistant', 'data-import', 'messages',
]

const ACCOUNTANT_PAGES: PageId[] = [
  'dashboard', 'payments', 'balance-tracker', 'reports', 'defaulter-list',
  'documents', 'subscription', 'help', 'guided', 'assistant',
]

const HOUSEKEEPER_PAGES: PageId[] = ['units', 'vacancy', 'maintenance', 'tenants', 'help', 'guided', 'assistant']

const TENANT_PAGES: PageId[] = ['my-balance', 'my-payments', 'my-lease', 'my-receipts', 'my-messages', 'help', 'guided', 'assistant']

/** Pages tenants must never access (billing, owner portfolio) */
export const TENANT_BLOCKED_PAGES: string[] = [
  'subscription', 'data-import', 'buildings', 'units', 'tenants', 'reports',
  'dashboard', 'payments', 'balance-tracker', 'deposits', 'vacancy', 'lease-manager',
  'utilities', 'reminders', 'maintenance', 'documents', 'legal-notices', 'settings',
  'blacklist', 'defaulter-list', 'tenant-preview', 'messages',
]

export const isBillingPage = (pageId: string): boolean =>
  ['subscription', 'billing', 'pricing', 'plans'].includes(pageId)

const ROLE_PAGE_MAP: Record<AppRole, PageId[]> = {
  property_owner: OWNER_PAGES,
  accountant: ACCOUNTANT_PAGES,
  housekeeper: HOUSEKEEPER_PAGES,
  tenant: TENANT_PAGES,
}

export const pagesForRole = (role: string): PageId[] => ROLE_PAGE_MAP[normalizeRole(role)] || []

export const canAccessPage = (role: string, pageId: string): boolean => {
  const r = normalizeRole(role)
  if (r === 'tenant' && (TENANT_BLOCKED_PAGES.includes(pageId) || isBillingPage(pageId))) {
    return false
  }
  return pagesForRole(role).includes(pageId as PageId)
}

export const defaultPageForRole = (role: string): PageId => {
  const pages = pagesForRole(role)
  return pages[0] || 'dashboard'
}

/** Pages that expose owner-only financial / secret data */
export const isOwnerOnlyPage = (pageId: string): boolean =>
  ['balance-tracker', 'reports', 'deposits', 'utilities', 'legal-notices', 'blacklist', 'defaulter-list', 'subscription', 'tenant-preview'].includes(pageId)

export const canSeeFinancials = (role: string): boolean => {
  const r = normalizeRole(role)
  return r === 'property_owner' || r === 'accountant'
}

export const isOwnerLoginRole = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'

export const canManagePortfolio = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'
