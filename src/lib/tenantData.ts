import { isoToday } from './dates'
import { generateInviteCode } from './invites'

export type DataSource = 'manual' | 'spreadsheet' | 'invite' | 'pdf'
export type DataQuality = 'complete' | 'partial' | 'minimal'

export const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  complete: 'Complete',
  partial: 'Partial',
  minimal: 'Minimal',
}

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  manual: 'Manual',
  spreadsheet: 'From spreadsheet',
  invite: 'Invite code',
  pdf: 'Has agreement PDF',
}

export const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmed = (fullName || '').trim()
  if (!trimmed) return { firstName: 'Tenant', lastName: 'Pending' }
  const parts = trimmed.split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || '—' }
}

export const displayTenantName = (tenant: Record<string, unknown> | null | undefined): string => {
  if (!tenant) return '—'
  const first = String(tenant.firstName || '')
  const last = String(tenant.lastName || '')
  if (first === 'Tenant' && last === 'Pending') return 'Tenant (name pending)'
  return `${first} ${last}`.trim() || '—'
}

/** Progressive completeness — never blocks usage */
export const computeDataQuality = (
  tenant: Record<string, unknown> | null | undefined,
  unit?: Record<string, unknown> | null,
): DataQuality => {
  if (!tenant && !unit) return 'minimal'
  const hasRealName =
    tenant &&
    tenant.firstName &&
    tenant.firstName !== 'Tenant' &&
    tenant.lastName !== 'Pending'
  const hasPhone = !!(tenant?.phone || tenant?.email)
  const hasLease = !!(tenant?.leaseStart && tenant?.leaseEnd)
  const hasRent = !!(tenant?.rentAmount || unit?.monthlyRent)
  const hasAgreement = !!(tenant?.agreementPdf || tenant?.leaseUrl)

  if (hasRealName && hasPhone && hasLease && hasRent) return 'complete'
  if (hasRealName || hasPhone || hasRent || hasAgreement) return 'partial'
  return 'minimal'
}

export type QuickTenantInput = {
  name?: string
  phone?: string
  monthlyRent: number
  moveInDate?: string
  deposit?: number
}

export const buildQuickTenant = (
  unit: Record<string, unknown>,
  input: QuickTenantInput,
  source: DataSource = 'manual',
  ownerId?: string,
): Record<string, unknown> => {
  const { firstName, lastName } = splitName(input.name || '')
  const tenantId = `t-${Date.now()}`
  const rent = input.monthlyRent || Number(unit.monthlyRent) || 0
  const moveIn = input.moveInDate || isoToday()
  const leaseEnd = new Date(moveIn)
  leaseEnd.setFullYear(leaseEnd.getFullYear() + 1)

  return {
    id: tenantId,
    ownerId: ownerId || unit.ownerId || '',
    unitId: unit.id,
    buildingId: unit.buildingId,
    firstName,
    lastName,
    phone: input.phone || '',
    email: '',
    whatsapp: input.phone || '',
    nin: '',
    guarantorName: '',
    guarantorPhone: '',
    leaseStart: moveIn,
    leaseEnd: leaseEnd.toISOString().split('T')[0],
    rentAmount: rent,
    depositPaid: 0,
    depositAmount: input.deposit ?? rent * 2,
    preferredLanguage: 'English',
    status: 'Active',
    notes: '',
    idPhotoUrl: '',
    leaseUrl: '',
    rating: 3,
    blacklisted: false,
    blacklistReason: '',
    rentDueDay: unit.rentDueDay || 5,
    dataSource: source,
    ownerNotes: '',
    internalFlags: [],
    importSourcePath: '',
    agreementPdf: null,
    shareAgreementWithTenant: false,
    noticePeriodDays: null,
  }
}

export const assignTenantToUnit = (
  unit: Record<string, unknown>,
  tenantId: string,
  inviteCode?: string,
): Record<string, unknown> => ({
  ...unit,
  status: 'occupied',
  currentTenantId: tenantId,
  inviteCode: inviteCode || unit.inviteCode || generateInviteCode(),
})

export const CSV_TEMPLATE = `property_name,unit_label,tenant_name,monthly_rent,phone,email,lease_start,lease_end,deposit,rent_due_day,guarantor_name,guarantor_phone,nin,bedrooms,notes
Nakawa Business Arcade,Flat 2B,John Okello,450000,+256700111222,john@email.com,2025-01-01,2026-12-31,900000,5,Robert Ssempijja,+256702111001,CM12345678ABCD,2,Quiet tenant
Nakawa Business Arcade,Shop G1,Mary Namukasa,800000,+256700333444,,2025-03-01,2026-02-28,1600000,5,Mary Nakato,+256773222002,,1,Retail shop
`
