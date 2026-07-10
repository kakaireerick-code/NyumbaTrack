import { monthsBetween } from './dates'

export type PaymentRow = {
  tenantId: string
  amount: number
  type?: string
  date?: string
}

export type TenantRentInfo = {
  id: string
  rentAmount: number
  leaseStart: string
  rentDueDay?: number
}

export const computeRentDue = (tenant: TenantRentInfo, asOf: Date = new Date()): number => {
  const months = monthsBetween(tenant.leaseStart, asOf)
  return tenant.rentAmount * months
}

export const computeTotalPaid = (tenantId: string, payments: PaymentRow[]): number =>
  payments
    .filter((p) => p.tenantId === tenantId && (p.type === 'rent' || !p.type))
    .reduce((sum, p) => sum + (p.amount || 0), 0)

export const computeArrears = (
  tenant: TenantRentInfo,
  payments: PaymentRow[],
  asOf: Date = new Date(),
): { totalDue: number; totalPaid: number; balance: number; isInArrears: boolean; daysLate: number } => {
  const totalDue = computeRentDue(tenant, asOf)
  const totalPaid = computeTotalPaid(tenant.id, payments)
  const balance = totalDue - totalPaid

  let daysLate = 0
  if (balance > 0) {
    const today = new Date()
    const dueDay = tenant.rentDueDay || 1
    const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
    if (today > due) daysLate = Math.floor((today.getTime() - due.getTime()) / 86400000)
  }

  return { totalDue, totalPaid, balance, isInArrears: balance > 0, daysLate }
}

export const formatCurrency = (n: number | null | undefined): string =>
  `UGX ${Math.round(n || 0).toLocaleString()}`
