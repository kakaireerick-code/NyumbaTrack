import type { BillingClaim } from './billingAdmin'

/** Map approved cloud claim to local subscription activation payload */
export const subscriptionFromApprovedClaim = (claim: BillingClaim) => {
  const start = new Date()
  const end = new Date(start)
  if (claim.billingCycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return {
    status: 'active' as const,
    planId: claim.planId,
    billingCycle: claim.billingCycle,
    amount: claim.amount,
    momoReference: claim.momoReference,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    activatedAt: new Date().toISOString(),
    activatedBy: 'billing_admin',
  }
}

export const claimSummaryLine = (claim: BillingClaim) =>
  `${claim.customerEmail} · ${claim.planId} · ${claim.momoReference} · UGX ${claim.amount.toLocaleString()}`

export const filterClaimsByStatus = (claims: BillingClaim[], status: string) =>
  status === 'all' ? claims : claims.filter((c) => c.status === status)

export const countPendingClaims = (claims: BillingClaim[]) =>
  claims.filter((c) => c.status === 'pending_verification').length
