import { monthsBetween } from './dates'

const GRACE_DAYS = 3

export type BehaviorGrade = 'Excellent' | 'Good' | 'Fair' | 'Needs attention'

export type RentStatus = 'up_to_date' | 'due_soon' | 'late' | 'behind'

export type LeaseCompliance = 'healthy' | 'expiring_soon' | 'expired'

export type TenantBehaviorPayment = {
  tenantId: string
  amount: number
  date?: string
  type?: string
  status?: string
}

export type TenantBehaviorInput = {
  tenant: {
    id: string
    leaseStart: string
    leaseEnd?: string
    rentAmount: number
    rentDueDay?: number
    depositPaid?: number
    depositAmount?: number
    status?: string
  }
  payments: TenantBehaviorPayment[]
  balance: {
    isInArrears: boolean
    daysLate: number
    balance: number
  }
  messagesSent?: number
  maintenanceIssuesForUnit?: number
}

export type TenantBehaviorStats = {
  overallScore: number
  grade: BehaviorGrade
  onTimePaymentRate: number
  onTimePayments: number
  totalPaymentEvents: number
  confirmedPayments: number
  pendingPayments: number
  totalRentPaid: number
  monthsTenanted: number
  paymentStreak: number
  messagesSent: number
  depositProgress: number
  leaseDaysLeft: number
  leaseCompliance: LeaseCompliance
  rentStatus: RentStatus
  tips: string[]
}

const monthKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}`

export const wasPaymentOnTime = (paymentDate: string, rentDueDay: number, graceDays = GRACE_DAYS): boolean => {
  const paid = new Date(paymentDate)
  if (Number.isNaN(paid.getTime())) return false
  const due = new Date(paid.getFullYear(), paid.getMonth(), rentDueDay)
  due.setDate(due.getDate() + graceDays)
  return paid <= due
}

export const computePaymentStreak = (
  payments: TenantBehaviorPayment[],
  rentDueDay: number,
  leaseStart: string,
): number => {
  const confirmed = payments.filter((p) => (p.type === 'rent' || !p.type) && p.status !== 'pending' && p.date)
  const earliestByMonth = new Map<string, Date>()
  for (const p of confirmed) {
    const d = new Date(p.date!)
    const key = monthKey(d)
    const existing = earliestByMonth.get(key)
    if (!existing || d < existing) earliestByMonth.set(key, d)
  }

  let streak = 0
  const now = new Date()
  let y = now.getFullYear()
  let m = now.getMonth()
  const leaseStartDate = new Date(leaseStart)

  while (true) {
    const cursor = new Date(y, m, 1)
    if (cursor < leaseStartDate) break

    const payDate = earliestByMonth.get(monthKey(cursor))
    if (!payDate || !wasPaymentOnTime(payDate.toISOString().split('T')[0], rentDueDay)) break

    streak++
    m -= 1
    if (m < 0) {
      m = 11
      y -= 1
    }
  }

  return streak
}

const gradeFromScore = (score: number): BehaviorGrade => {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs attention'
}

const rentStatusFromBalance = (balance: TenantBehaviorInput['balance'], daysUntilDue: number): RentStatus => {
  if (!balance.isInArrears && balance.balance <= 0) return 'up_to_date'
  if (balance.daysLate > 14 || balance.balance > 0) return balance.daysLate > 30 ? 'behind' : 'late'
  if (daysUntilDue <= 7) return 'due_soon'
  return 'up_to_date'
}

const leaseComplianceFrom = (leaseEnd: string | undefined): { compliance: LeaseCompliance; daysLeft: number } => {
  if (!leaseEnd) return { compliance: 'healthy', daysLeft: 365 }
  const daysLeft = Math.ceil((new Date(leaseEnd).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return { compliance: 'expired', daysLeft }
  if (daysLeft <= 60) return { compliance: 'expiring_soon', daysLeft }
  return { compliance: 'healthy', daysLeft }
}

const buildTips = (stats: Omit<TenantBehaviorStats, 'tips'>): string[] => {
  const tips: string[] = []
  if (stats.rentStatus === 'late' || stats.rentStatus === 'behind') {
    tips.push('Pay rent before the due date to improve your on-time score.')
  }
  if (stats.onTimePaymentRate < 80) {
    tips.push('Try paying within 3 days of your rent due day each month.')
  }
  if (stats.depositProgress < 100) {
    tips.push('Complete your deposit payments — landlords value full deposit coverage.')
  }
  if (stats.leaseCompliance === 'expiring_soon') {
    tips.push('Your lease ends soon — message your landlord about renewal.')
  }
  if (stats.pendingPayments > 0) {
    tips.push('You have pending payment notices — your landlord will confirm them soon.')
  }
  if (stats.paymentStreak >= 3) {
    tips.push(`Great job — ${stats.paymentStreak} month streak of on-time payments!`)
  }
  if (!tips.length) {
    tips.push('Keep paying on time and staying in touch with your landlord.')
  }
  return tips.slice(0, 3)
}

export const computeTenantBehavior = (input: TenantBehaviorInput, asOf: Date = new Date()): TenantBehaviorStats => {
  const { tenant, payments, balance } = input
  const tenantId = tenant.id
  const rentDueDay = tenant.rentDueDay || 5

  const rentPayments = payments.filter((p) => p.tenantId === tenantId && (p.type === 'rent' || !p.type))
  const confirmed = rentPayments.filter((p) => p.status !== 'pending')
  const pending = rentPayments.filter((p) => p.status === 'pending')

  const onTimePayments = confirmed.filter(
    (p) => p.date && wasPaymentOnTime(p.date, rentDueDay),
  ).length

  const totalPaymentEvents = confirmed.length
  const onTimePaymentRate =
    totalPaymentEvents > 0 ? Math.round((onTimePayments / totalPaymentEvents) * 100) : balance.isInArrears ? 0 : 100

  const totalRentPaid = confirmed.reduce((sum, p) => sum + (p.amount || 0), 0)
  const monthsTenanted = monthsBetween(tenant.leaseStart, asOf)
  const paymentStreak = computePaymentStreak(rentPayments, rentDueDay, tenant.leaseStart)

  const depositAmount = tenant.depositAmount || tenant.rentAmount * 2 || 0
  const depositPaid = tenant.depositPaid || 0
  const depositProgress = depositAmount > 0 ? Math.min(100, Math.round((depositPaid / depositAmount) * 100)) : 100

  const { compliance: leaseCompliance, daysLeft: leaseDaysLeft } = leaseComplianceFrom(tenant.leaseEnd)

  const today = asOf
  const due = new Date(today.getFullYear(), today.getMonth(), rentDueDay)
  if (due < today) due.setMonth(due.getMonth() + 1)
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000)
  const rentStatus = rentStatusFromBalance(balance, daysUntilDue)

  const rentStatusScore =
    rentStatus === 'up_to_date' ? 100 : rentStatus === 'due_soon' ? 70 : rentStatus === 'late' ? 40 : 10
  const leaseScore = leaseCompliance === 'healthy' ? 100 : leaseCompliance === 'expiring_soon' ? 60 : 20

  const overallScore = Math.round(
    onTimePaymentRate * 0.45 + rentStatusScore * 0.3 + depositProgress * 0.15 + leaseScore * 0.1,
  )

  const base: Omit<TenantBehaviorStats, 'tips'> = {
    overallScore,
    grade: gradeFromScore(overallScore),
    onTimePaymentRate,
    onTimePayments,
    totalPaymentEvents,
    confirmedPayments: confirmed.length,
    pendingPayments: pending.length,
    totalRentPaid,
    monthsTenanted,
    paymentStreak,
    messagesSent: input.messagesSent || 0,
    depositProgress,
    leaseDaysLeft,
    leaseCompliance,
    rentStatus,
  }

  return { ...base, tips: buildTips(base) }
}
