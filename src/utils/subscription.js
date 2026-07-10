import { TRIAL_PLAN, getPlanById } from '../data/subscriptionPlans'

export const isSubscriptionActive = (sub) => {
  if (!sub) return false
  if (sub.status === 'trialing' || sub.status === 'active') {
    const end = sub.status === 'trialing' ? sub.trialEndsAt : sub.currentPeriodEnd
    if (!end) return false
    return new Date(end) >= new Date()
  }
  return false
}

export const daysRemaining = (endDate) => {
  if (!endDate) return 0
  return Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000))
}

export const startFreeTrial = (sub) => {
  if (sub.hasUsedTrial) return sub
  const now = new Date()
  const ends = new Date(now)
  ends.setDate(ends.getDate() + TRIAL_PLAN.durationDays)
  return {
    ...sub,
    planId: 'trial',
    status: 'trialing',
    trialStartedAt: now.toISOString(),
    trialEndsAt: ends.toISOString(),
    hasUsedTrial: true,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: ends.toISOString(),
  }
}

export const activatePlan = (sub, planId, billingCycle, amount) => {
  const now = new Date()
  const ends = new Date(now)
  if (billingCycle === 'yearly') {
    ends.setFullYear(ends.getFullYear() + 1)
  } else {
    ends.setMonth(ends.getMonth() + 1)
  }
  return {
    ...sub,
    planId,
    billingCycle,
    status: 'active',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: ends.toISOString(),
    paymentHistory: [
      ...(sub.paymentHistory || []),
      {
        id: `sub-${Date.now()}`,
        planId,
        billingCycle,
        amount,
        date: now.toISOString().split('T')[0],
        method: 'MTN MoMo',
        reference: `SUB-${planId.toUpperCase()}-${Date.now()}`,
      },
    ],
  }
}

export const getSubscriptionLabel = (sub) => {
  if (!sub || sub.status === 'none') return 'No plan'
  const plan = getPlanById(sub.planId)
  const name = plan?.name || sub.planId
  if (sub.status === 'trialing') return `${name} (Trial)`
  if (sub.status === 'active') return `${name} (${sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`
  return 'Expired'
}

export const getActiveEndDate = (sub) => {
  if (sub.status === 'trialing') return sub.trialEndsAt
  if (sub.status === 'active') return sub.currentPeriodEnd
  return null
}

export const needsSubscription = (role) =>
  role === 'admin' || role === 'property_owner' || role === 'accountant'

export const checkUnitLimit = (sub, unitCount) => {
  const plan = getPlanById(sub?.planId)
  const limit = plan?.unitLimit
  if (limit == null) return true
  return unitCount <= limit
}
