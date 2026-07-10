import React, { useState } from 'react'
import { Check, Sparkles, Crown, Building2, Zap } from 'lucide-react'
import { fmtUGX } from '../utils/helpers'
import {
  SUBSCRIPTION_PLANS,
  TRIAL_PLAN,
  yearlySavings,
} from '../data/subscriptionPlans'
import {
  isSubscriptionActive,
  daysRemaining,
  getSubscriptionLabel,
  getActiveEndDate,
} from '../utils/subscription'
import { Badge, LoadingButton } from '../components/UI'

const PLAN_ICONS = {
  starter: Zap,
  growth: Building2,
  professional: Crown,
  enterprise: Sparkles,
}

export default function SubscriptionPage({
  subscription,
  setSubscription,
  settings,
  showToast,
  units,
  currentUser,
}) {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [confirmPlan, setConfirmPlan] = useState(null)

  const active = isSubscriptionActive(subscription)
  const endDate = getActiveEndDate(subscription)
  const daysLeft = daysRemaining(endDate)

  const startTrial = () => {
    if (subscription.hasUsedTrial) {
      showToast('Free trial already used on this account. Please choose a paid plan.', 'error')
      return
    }
    setLoading('trial')
    setTimeout(() => {
      const now = new Date()
      const ends = new Date(now)
      ends.setDate(ends.getDate() + TRIAL_PLAN.durationDays)
      setSubscription({
        ...subscription,
        planId: 'trial',
        status: 'trialing',
        trialStartedAt: now.toISOString(),
        trialEndsAt: ends.toISOString(),
        hasUsedTrial: true,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: ends.toISOString(),
      })
      showToast(`Free trial started! ${TRIAL_PLAN.durationDays} days of full access.`, 'success')
      setLoading(null)
    }, 600)
  }

  const subscribe = (plan) => {
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    setLoading(plan.id)
    setTimeout(() => {
      const now = new Date()
      const ends = new Date(now)
      if (billingCycle === 'yearly') ends.setFullYear(ends.getFullYear() + 1)
      else ends.setMonth(ends.getMonth() + 1)
      setSubscription({
        ...subscription,
        planId: plan.id,
        billingCycle,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: ends.toISOString(),
        paymentHistory: [
          ...(subscription.paymentHistory || []),
          {
            id: `sub-${Date.now()}`,
            planId: plan.id,
            billingCycle,
            amount,
            date: now.toISOString().split('T')[0],
            method: 'MTN MoMo',
            reference: `SUB-${plan.id.toUpperCase()}-${Date.now()}`,
          },
        ],
      })
      showToast(`Subscribed to ${plan.name} (${billingCycle})!`, 'success')
      setConfirmPlan(null)
      setLoading(null)
    }, 800)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Plans & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your RentTrack Uganda subscription
        </p>
      </div>

      {active && (
        <div className="card p-4 border-l-4 border-[#2d6a4f] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{getSubscriptionLabel(subscription)}</p>
            <p className="text-sm text-gray-500">
              {subscription.status === 'trialing'
                ? `${daysLeft} days left in your free trial`
                : `Renews in ${daysLeft} days (${endDate ? new Date(endDate).toLocaleDateString('en-UG') : ''})`}
            </p>
            <p className="text-xs text-gray-400 mt-1">{units?.length || 0} units in use</p>
          </div>
          {subscription.status === 'trialing' && (
            <Badge color="green">Free Trial Active</Badge>
          )}
        </div>
      )}

      {!subscription.hasUsedTrial && subscription.status === 'none' && (
        <div className="card p-6 bg-gradient-to-br from-[#2d6a4f]/10 to-[#40916c]/10 border-2 border-[#2d6a4f]/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-[#2d6a4f]" size={24} />
                Start Your Free Trial
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {TRIAL_PLAN.tagline}. No payment required — explore every feature for {TRIAL_PLAN.durationDays} days.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {TRIAL_PLAN.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={14} className="text-[#2d6a4f]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <LoadingButton
              loading={loading === 'trial'}
              onClick={startTrial}
              className="px-6 py-3 bg-[#2d6a4f] text-white rounded-lg font-semibold whitespace-nowrap hover:opacity-90"
            >
              Start 14-Day Free Trial
            </LoadingButton>
          </div>
        </div>
      )}

      {subscription.hasUsedTrial && !active && (
        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <p className="font-medium text-orange-800 dark:text-orange-200">
            Your free trial has ended. Choose a plan below to continue using RentTrack Uganda.
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border dark:border-gray-600 p-1 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly' ? 'bg-[#2d6a4f] text-white' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly' ? 'bg-[#2d6a4f] text-white' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Yearly <span className="text-xs opacity-80">(Save 2 months)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Building2
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
          const perMonth = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
          const savings = yearlySavings(plan)
          const isCurrent = subscription.planId === plan.id && subscription.status === 'active'

          return (
            <div
              key={plan.id}
              className={`card p-5 flex flex-col relative ${
                plan.popular ? 'ring-2 ring-[#2d6a4f] shadow-lg' : ''
              } ${isCurrent ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-[#2d6a4f] text-white text-xs">
                  Most Popular
                </span>
              )}
              <Icon className="text-[#2d6a4f] mb-2" size={28} />
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{plan.tagline}</p>
              <p className="text-2xl font-bold text-[#2d6a4f]">
                {fmtUGX(price)}
                <span className="text-sm font-normal text-gray-500">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </p>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-green-600 mt-1">
                  {fmtUGX(perMonth)}/mo · Save {fmtUGX(savings)}
                </p>
              )}
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="text-[#40916c] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <LoadingButton
                loading={loading === plan.id}
                disabled={isCurrent}
                onClick={() => setConfirmPlan(plan)}
                className={`mt-4 w-full py-2.5 rounded font-medium ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 cursor-default'
                    : plan.popular
                      ? 'bg-[#2d6a4f] text-white hover:opacity-90'
                      : 'border-2 border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Choose Plan'}
              </LoadingButton>
            </div>
          )
        })}
      </div>

      <div className="card p-4 text-sm text-gray-600 dark:text-gray-300">
        <h3 className="font-semibold mb-2">Payment Methods</h3>
        <p>Pay via MTN MoMo: <strong>{settings.mtnMomo}</strong> or Airtel Money: <strong>{settings.airtelMoney}</strong></p>
        <p className="mt-1 text-xs text-gray-400">
          Use reference: RENTTRACK-{currentUser?.name?.replace(/\s/g, '') || 'YOURNAME'}. In production, mobile money and card payments will be processed automatically.
        </p>
      </div>

      {(subscription.paymentHistory || []).length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Billing History</h3>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Cycle</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {subscription.paymentHistory.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.date}</td>
                    <td className="p-2 capitalize">{p.planId}</td>
                    <td className="p-2 capitalize">{p.billingCycle}</td>
                    <td className="p-2">{fmtUGX(p.amount)}</td>
                    <td className="p-2 font-mono text-xs">{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmPlan(null)}>
          <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Confirm Subscription</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {confirmPlan.name} — {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </p>
            <p className="text-2xl font-bold text-[#2d6a4f] mt-2">
              {fmtUGX(billingCycle === 'yearly' ? confirmPlan.yearlyPrice : confirmPlan.monthlyPrice)}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Send payment to MTN MoMo {settings.mtnMomo} and click confirm. Your plan activates immediately in this demo.
            </p>
            <div className="flex gap-2 mt-4">
              <button type="button" className="flex-1 py-2 border rounded" onClick={() => setConfirmPlan(null)}>Cancel</button>
              <LoadingButton
                loading={loading === confirmPlan.id}
                className="flex-1 py-2 bg-[#2d6a4f] text-white rounded"
                onClick={() => subscribe(confirmPlan)}
              >
                Confirm Payment
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
