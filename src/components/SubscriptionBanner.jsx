import React from 'react'
import { isSubscriptionActive, daysRemaining, getActiveEndDate, getSubscriptionLabel } from '../utils/subscription'

export default function SubscriptionBanner({ subscription, setCurrentPage }) {
  const active = isSubscriptionActive(subscription)
  const endDate = getActiveEndDate(subscription)
  const daysLeft = daysRemaining(endDate)

  if (subscription.status === 'none' && !subscription.hasUsedTrial) {
    return (
      <div className="bg-[#2d6a4f] text-white px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>🎉 New here? Start your 14-day free trial — no payment required.</span>
        <button type="button" onClick={() => setCurrentPage('subscription')} className="underline font-medium whitespace-nowrap">
          Start Free Trial →
        </button>
      </div>
    )
  }

  if (subscription.status === 'trialing' && active) {
    return (
      <div className={`px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2 ${
        daysLeft <= 3 ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200' : 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200'
      }`}>
        <span>
          Free trial: <strong>{daysLeft} days</strong> remaining — {getSubscriptionLabel(subscription)}
        </span>
        <button type="button" onClick={() => setCurrentPage('subscription')} className="underline font-medium">
          View Plans →
        </button>
      </div>
    )
  }

  if (subscription.status === 'pending_verification') {
    return (
      <div className="bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200 px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>MoMo payment pending admin verification — plan not active yet.</span>
        <button type="button" onClick={() => setCurrentPage('subscription')} className="underline font-medium">
          View status →
        </button>
      </div>
    )
  }

  if (!active && subscription.hasUsedTrial && subscription.status !== 'pending_verification') {
    return (
      <div className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200 px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>Your subscription has expired. Upgrade to continue managing your properties.</span>
        <button type="button" onClick={() => setCurrentPage('subscription')} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium">
          Choose a Plan
        </button>
      </div>
    )
  }

  if (subscription.status === 'active' && daysLeft <= 7) {
    return (
      <div className="bg-orange-100 text-orange-900 px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>Plan renews in {daysLeft} days — {getSubscriptionLabel(subscription)}</span>
        <button type="button" onClick={() => setCurrentPage('subscription')} className="underline font-medium">Manage</button>
      </div>
    )
  }

  return null
}
