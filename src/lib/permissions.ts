/**
 * Central permission module — all role/page/field checks go through here.
 * Roles: property_owner | caretaker | tenant (exactly three).
 */

export type Role = 'property_owner' | 'caretaker' | 'tenant'

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
  | 'billing-admin'
  | 'blacklist'
  | 'defaulter-list'
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
  | 'receipt-view'

export type FieldKey =
  | 'unit.monthlyRent'
  | 'unit.depositAmount'
  | 'unit.inviteCode'
  | 'unit.ownerNotes'
  | 'tenant.rentAmount'
  | 'tenant.depositPaid'
  | 'tenant.depositAmount'
  | 'tenant.balance'
  | 'tenant.payments'
  | 'payment.amount'
  | 'receipt.amount'
  | 'receipt.list'
  | 'subscription.billing'
  | 'owner.revenue'

const FINANCIAL_FIELDS: FieldKey[] = [
  'unit.monthlyRent',
  'unit.depositAmount',
  'tenant.rentAmount',
  'tenant.depositPaid',
  'tenant.depositAmount',
  'tenant.balance',
  'tenant.payments',
  'payment.amount',
  'receipt.amount',
  'receipt.list',
  'subscription.billing',
  'owner.revenue',
]

const OWNER_ONLY_FIELDS: FieldKey[] = [
  'unit.inviteCode',
  'unit.ownerNotes',
  'subscription.billing',
  'owner.revenue',
]

/** Legacy role aliases from stored users / old code */
export const normalizeRole = (role: string): Role => {
  if (role === 'admin' || role === 'property_owner' || role === 'accountant') return 'property_owner'
  if (role === 'caretaker' || role === 'housekeeper') return 'caretaker'
  return 'tenant'
}

const OWNER_PAGES: PageId[] = [
  'dashboard', 'buildings', 'units', 'vacancy', 'tenants', 'lease-manager',
  'payments', 'balance-tracker', 'deposits', 'utilities', 'reminders',
  'maintenance', 'reports', 'documents', 'legal-notices', 'settings',
  'subscription', 'billing-admin', 'blacklist', 'defaulter-list', 'help', 'guided', 'assistant',
  'data-import', 'messages', 'receipt-view',
]

const CARETAKER_PAGES: PageId[] = [
  'units', 'vacancy', 'maintenance', 'tenants', 'help', 'guided', 'assistant', 'messages',
]

const TENANT_PAGES: PageId[] = [
  'my-balance', 'my-payments', 'my-lease', 'my-receipts', 'my-messages',
  'help', 'guided', 'assistant', 'receipt-view',
]

const ROLE_PAGE_MAP: Record<Role, PageId[]> = {
  property_owner: OWNER_PAGES,
  caretaker: CARETAKER_PAGES,
  tenant: TENANT_PAGES,
}

export const TENANT_BLOCKED_PAGES: string[] = [
  'subscription', 'billing-admin', 'data-import', 'buildings', 'units', 'tenants', 'reports',
  'dashboard', 'payments', 'balance-tracker', 'deposits', 'vacancy', 'lease-manager',
  'utilities', 'reminders', 'maintenance', 'documents', 'legal-notices', 'settings',
  'blacklist', 'defaulter-list', 'messages',
]

export const isBillingPage = (pageId: string): boolean =>
  ['subscription', 'billing', 'pricing', 'plans'].includes(pageId)

export const pagesForRole = (role: string): PageId[] =>
  ROLE_PAGE_MAP[normalizeRole(role)] || []

export const canAccessPage = (role: string, pageId: string): boolean => {
  const r = normalizeRole(role)
  if (r === 'tenant' && (TENANT_BLOCKED_PAGES.includes(pageId) || isBillingPage(pageId))) {
    return false
  }
  if (r === 'caretaker' && (pageId === 'receipt-view' || pageId === 'my-receipts')) {
    return false
  }
  return pagesForRole(role).includes(pageId as PageId)
}

export const defaultPageForRole = (role: string): PageId => {
  const pages = pagesForRole(role)
  return pages[0] || 'dashboard'
}

export const canViewField = (role: string, fieldKey: FieldKey): boolean => {
  const r = normalizeRole(role)
  if (r === 'property_owner') return true

  if (r === 'tenant') {
    if (fieldKey === 'tenant.rentAmount' || fieldKey === 'tenant.balance') return true
    if (fieldKey === 'receipt.amount' || fieldKey === 'receipt.list') return true
    if (fieldKey === 'subscription.billing' || fieldKey === 'owner.revenue') return false
    if (fieldKey.startsWith('unit.') && fieldKey !== 'unit.monthlyRent') return false
    return false
  }

  if (r === 'caretaker') {
    if (fieldKey === 'receipt.list' || fieldKey === 'receipt.amount') return false
    return !FINANCIAL_FIELDS.includes(fieldKey) && !OWNER_ONLY_FIELDS.includes(fieldKey)
  }

  return false
}

export const canSeeFinancials = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'

export const isCaretakerRole = (role: string): boolean =>
  normalizeRole(role) === 'caretaker'

export const isTenantRole = (role: string): boolean =>
  normalizeRole(role) === 'tenant'

export const canViewMaintenanceCost = (role: string): boolean =>
  canSeeFinancials(role)

export const canAccessOwnerEntry = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'

/** Caretakers must not receive payment records in portal props or session views */
export const filterPaymentsForRole = <T>(role: string, payments: T[]): T[] =>
  isCaretakerRole(role) ? [] : payments

export const filterMaintenanceForRole = <T extends { status?: string }>(
  role: string,
  rows: T[],
): T[] => {
  if (!isCaretakerRole(role)) return rows
  return rows.filter((m) => m.status === 'open' || m.status === 'in_progress')
}

export const isOwnerLoginRole = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'

export const canManagePortfolio = (role: string): boolean =>
  normalizeRole(role) === 'property_owner'

export const isOwnerOnlyPage = (pageId: string): boolean =>
  ['balance-tracker', 'reports', 'deposits', 'utilities', 'legal-notices',
    'blacklist', 'defaulter-list', 'subscription'].includes(pageId)

const CARETAKER_STRIP_KEYS = new Set([
  'monthlyRent', 'depositAmount', 'rentAmount', 'depositPaid', 'balance',
  'payments', 'ownerNotes', 'inviteCode', 'expenses', 'maintenanceLog',
  'netYield', 'internalFlags', 'rating', 'blacklisted', 'blacklistReason',
])

export const getCaretakerSafeRecord = <T extends Record<string, unknown>>(
  record: T | null | undefined,
): T | null => {
  if (!record) return null
  const safe = { ...record }
  for (const key of Object.keys(safe)) {
    if (CARETAKER_STRIP_KEYS.has(key)) {
      delete safe[key]
    }
  }
  return safe
}

export type OwnerAction =
  | 'issue_receipt'
  | 'record_payment'
  | 'manage_subscription'
  | 'create_invite'
  | 'import_data'

export class PermissionDeniedError extends Error {
  readonly status = 403
  constructor(message = 'Not allowed') {
    super(message)
    this.name = 'PermissionDeniedError'
  }
}

export const assertOwnerOnly = (role: string, action: OwnerAction): void => {
  if (!canManagePortfolio(role)) {
    throw new PermissionDeniedError(`Owner only: ${action}`)
  }
}

/** @deprecated use normalizeRole — kept for gradual migration */
export type AppRole = Role
