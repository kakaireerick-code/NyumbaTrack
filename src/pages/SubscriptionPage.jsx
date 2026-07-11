import React, { useState } from 'react'
import {
  Check,
  Sparkles,
  Crown,
  Building2,
  Zap,
  Smartphone,
  FileText,
  Gift,
  HelpCircle,
  Mail,
  X,
} from 'lucide-react'
import { fmtUGX } from '../utils/helpers'
import {
  SUBSCRIPTION_PLANS,
  TRIAL_PLAN,
  YEARLY_BILLING_OFFER,
  BILLING_EXTRAS,
  BILLING_FAQ,
  yearlySavings,
  yearlySavingsPercent,
  yearlyPerMonth,
  annualMonthlyTotal,
  formatBuildingLimit,
  formatUnitLimit,
  getPlanById,
  ALL_PLAN_FEATURES,
} from '../data/subscriptionPlans'
import {
  isSubscriptionActive,
  daysRemaining,
  getSubscriptionLabel,
  getActiveEndDate,
  checkUnitLimit,
} from '../utils/subscription'
import { ADMIN_MOMO_LINE, ADMIN_MOMO_DISPLAY, subscriptionPaymentReference } from '../lib/billing'
import { getPartnerRewards } from '../lib/partnerRewards'
import { verifyMomoReference, collectSubscriptionReferences } from '../lib/momoVerification'
import { buildSubscriptionInvoice, queueInvoiceEmail, downloadInvoice } from '../lib/subscriptionInvoice'
import { submitCloudSubscriptionClaim } from '../lib/subscriptionCloud'
import { inputCls } from '../lib/formStyles'
import { Badge, LoadingButton } from '../components/UI'
import SubscriptionInvoiceModal from '../components/SubscriptionInvoiceModal'

const PLAN_ICONS = {
  starter: Zap,
  growth: Building2,
  professional: Crown,
  enterprise: Sparkles,
}

const findInvoiceForPayment = (payment, invoices = []) =>
  invoices.find((inv) => inv.momoReference === payment.reference) || null

const planHasFeature = (plan, feature) => plan.features.includes(feature)

export default function SubscriptionPage({
  subscription,
  setSubscription,
  showToast,
  units,
  currentUser,
  authUser,
  settings = {},
  setCurrentPage,
  activeOwnerId,
}) {
  const [billingCycle, setBillingCycle] = useState(subscription.billingCycle || 'monthly')
  const [loading, setLoading] = useState(null)
  const [confirmPlan, setConfirmPlan] = useState(null)
  const [momoReference, setMomoReference] = useState('')
  const [latestInvoice, setLatestInvoice] = useState(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const customerEmail = authUser?.email || currentUser?.email || ''
  const customerName = authUser?.name || currentUser?.name || 'Customer'
  const ownerId = activeOwnerId || authUser?.ownerId || authUser?.id || ''
  const partnerRewards = ownerId ? getPartnerRewards(ownerId) : null

  const active = isSubscriptionActive(subscription)
  const endDate = getActiveEndDate(subscription)
  const daysLeft = daysRemaining(endDate)
  const paymentHistory = subscription.paymentHistory || []
  const invoices = subscription.invoices || []
  const emailInbox = subscription.emailInbox || []
  const unitCount = units?.length || 0
  const withinUnitLimit = checkUnitLimit(subscription, unitCount)
  const currentPlan = getPlanById(subscription.planId)

  const startTrial = () => {
    if (subscription.hasUsedTrial) {
      showToast('Free trial already used on this account. Please choose a paid plan.', 'error')
      return
    }
    if (!customerEmail) {
      showToast('Sign in with Google first so we can send your invoice after you subscribe.', 'error')
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

  const subscribe = async (plan) => {
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    const ref = momoReference.trim()
    const verify = verifyMomoReference(ref, collectSubscriptionReferences(paymentHistory))
    if (!verify.ok) {
      showToast(verify.error, 'error')
      return
    }
    if (!customerEmail) {
      showToast('Sign in with Google so we can email your invoice.', 'error')
      return
    }

    setLoading(plan.id)

    const claimResult = await submitCloudSubscriptionClaim({
      customerEmail,
      customerName,
      ownerId: authUser?.ownerId || authUser?.id,
      planId: plan.id,
      billingCycle,
      amount,
      momoReference: ref,
    })

    if (!claimResult.ok) {
      showToast(claimResult.error, 'error')
      setLoading(null)
      return
    }

    const now = new Date()
    const paymentRecord = {
      id: `sub-${Date.now()}`,
      planId: plan.id,
      billingCycle,
      amount,
      date: now.toISOString().split('T')[0],
      method: 'MTN MoMo',
      reference: ref,
      paidTo: ADMIN_MOMO_LINE,
      status: 'pending_verification',
    }

    setSubscription({
      ...subscription,
      planId: plan.id,
      billingCycle,
      status: 'pending_verification',
      pendingClaimId: claimResult.claimId,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      paymentHistory: [...paymentHistory, paymentRecord],
    })

    setConfirmPlan(null)
    setMomoReference('')
    showToast(
      claimResult.message ||
        'Payment submitted for verification. Your plan activates after MoMo is confirmed.',
      'success',
    )
    setLoading(null)
  }

  const payAmount = confirmPlan
    ? billingCycle === 'yearly'
      ? confirmPlan.yearlyPrice
      : confirmPlan.monthlyPrice
    : 0

  const payRefHint = confirmPlan ? subscriptionPaymentReference(confirmPlan.id, customerName) : ''

  const cycleBtn = (cycle) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      billingCycle === cycle ? 'bg-[#2d6a4f] text-white' : 'text-gray-600 dark:text-gray-300'
    }`

  const maxYearlySavings = Math.max(...SUBSCRIPTION_PLANS.map((p) => yearlySavings(p)))

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 pb-12">
      <SubscriptionInvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={latestInvoice}
        emailSent={emailSent}
      />

      <div className="text-center">
        <h1 className="text-2xl font-bold">Plans & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monthly or yearly plans for property owners — tenants use NyumbaTrack free
        </p>
        {authUser?.authProvider === 'google' && (
          <p className="text-sm text-[#2d6a4f] mt-2">
            Signed in as {customerEmail} — invoices go to this Gmail
          </p>
        )}
      </div>

      {/* Partner Rewards — always visible */}
      {partnerRewards && (
        <div className="card p-5 border-2 border-brand/30 bg-brand-muted/20 dark:bg-brand/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-brand">
                <Gift size={22} />
                Partner Rewards
              </h2>
              {partnerRewards.bankedMonths > 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  You have <strong>{partnerRewards.bankedMonths}</strong> free month
                  {partnerRewards.bankedMonths === 1 ? '' : 's'} banked toward your next renewal.
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Refer another landlord — when they complete their first owner login, you earn discounted billing months.
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Code: <span className="font-mono font-semibold">{partnerRewards.referralCode}</span>
              </p>
            </div>
            {setCurrentPage && (
              <button
                type="button"
                onClick={() => setCurrentPage('referrals')}
                className="tap-target px-5 py-2.5 bg-brand text-white rounded-lg font-semibold whitespace-nowrap hover:opacity-90"
              >
                {partnerRewards.bankedMonths > 0 ? 'View rewards' : 'Get your invite link'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Yearly offer banner */}
      <div
        className={`card p-5 border-2 ${
          billingCycle === 'yearly'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-[#40916c]/40 bg-gradient-to-r from-[#2d6a4f]/5 to-[#40916c]/10'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Gift className="text-[#2d6a4f]" size={22} />
              {YEARLY_BILLING_OFFER.headline}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {YEARLY_BILLING_OFFER.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Pay for {YEARLY_BILLING_OFFER.monthsPaid} months · get {YEARLY_BILLING_OFFER.monthsIncluded}{' '}
              months · save up to {fmtUGX(maxYearlySavings)}/year on Enterprise
            </p>
          </div>
          {billingCycle !== 'yearly' && (
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className="px-5 py-2.5 bg-[#2d6a4f] text-white rounded-lg font-semibold whitespace-nowrap hover:opacity-90"
            >
              Switch to yearly & save
            </button>
          )}
          {billingCycle === 'yearly' && (
            <Badge color="green">Yearly offer applied</Badge>
          )}
        </div>
      </div>

      {active && (
        <div className="card p-4 border-l-4 border-[#2d6a4f] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{getSubscriptionLabel(subscription)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subscription.status === 'trialing'
                ? `${daysLeft} days left in your free trial — subscribe before it ends`
                : `Renews in ${daysLeft} days (${endDate ? new Date(endDate).toLocaleDateString('en-UG') : ''})`}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {unitCount} units in use
              {currentPlan?.unitLimit ? ` / ${currentPlan.unitLimit} limit` : ' / unlimited'}
              {subscription.billingCycle ? ` · Billed ${subscription.billingCycle}` : ''}
            </p>
            {currentPlan && subscription.status === 'active' && (
              <p className="text-xs text-[#2d6a4f] mt-1">
                {subscription.billingCycle === 'yearly'
                  ? `${fmtUGX(currentPlan.yearlyPrice)}/year (${fmtUGX(yearlyPerMonth(currentPlan))}/mo effective)`
                  : `${fmtUGX(currentPlan.monthlyPrice)}/month`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
          {subscription.status === 'trialing' && <Badge color="green">Free Trial Active</Badge>}
          {subscription.status === 'active' && <Badge color="blue">Active Plan</Badge>}
          {subscription.status === 'pending_verification' && (
            <Badge color="orange">Pending MoMo verification</Badge>
          )}
            {!withinUnitLimit && <Badge color="orange">Over unit limit</Badge>}
          </div>
        </div>
      )}

      {!subscription.hasUsedTrial && subscription.status === 'none' && (
        <div className="card p-6 bg-gradient-to-br from-[#2d6a4f]/10 to-[#40916c]/10 border-2 border-[#2d6a4f]/30">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-[#2d6a4f]" size={24} />
                {TRIAL_PLAN.name} — {TRIAL_PLAN.durationDays} days
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{TRIAL_PLAN.tagline}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No MoMo payment required. After the trial, choose monthly or yearly — yearly saves 2 months.
              </p>
              <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {TRIAL_PLAN.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check size={14} className="text-[#2d6a4f] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <LoadingButton
              loading={loading === 'trial'}
              onClick={startTrial}
              className="px-6 py-3 bg-[#2d6a4f] text-white rounded-lg font-semibold whitespace-nowrap hover:opacity-90 shrink-0"
            >
              Start {TRIAL_PLAN.durationDays}-Day Free Trial
            </LoadingButton>
          </div>
        </div>
      )}

      {subscription.status === 'pending_verification' && (
        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 space-y-2">
          <p className="font-medium text-orange-800 dark:text-orange-200">
            Your MoMo payment is <strong>pending verification</strong>. An admin will confirm payment to{' '}
            {ADMIN_MOMO_DISPLAY} and activate your plan. You will receive an invoice by email once approved.
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Typical review time: same business day. Keep your transaction reference{' '}
            <strong>{subscription.momoReference || momoReference || 'on your MoMo SMS'}</strong> handy.
          </p>
        </div>
      )}

      {subscription.hasUsedTrial && !active && subscription.status !== 'pending_verification' && (
        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <p className="font-medium text-orange-800 dark:text-orange-200">
            Your free trial has ended. Pick monthly or yearly below and pay to{' '}
            <strong>{ADMIN_MOMO_DISPLAY}</strong> to continue.
          </p>
        </div>
      )}

      <div className="card p-4 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Smartphone size={18} /> Official subscription payment line
        </h3>
        <p className="text-lg font-bold mt-1">MTN MoMo: {ADMIN_MOMO_LINE}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{ADMIN_MOMO_DISPLAY}</p>
        {settings.mtnMomo && settings.mtnMomo !== ADMIN_MOMO_LINE && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Your building MoMo (rent collections): <strong>{settings.mtnMomo}</strong>
          </p>
        )}
        {settings.airtelMoney && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Airtel Money (rent collections): <strong>{settings.airtelMoney}</strong>
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Subscription fees go to the NyumbaTrack admin MoMo line above — not your building rent numbers.
          Invoice emailed to Google after you confirm your transaction reference.
        </p>
      </div>

      {/* Billing cycle */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose billing cycle</p>
        <div className="inline-flex rounded-lg border dark:border-gray-600 p-1 bg-white dark:bg-gray-800">
          <button type="button" onClick={() => setBillingCycle('monthly')} className={cycleBtn('monthly')}>
            Monthly
          </button>
          <button type="button" onClick={() => setBillingCycle('yearly')} className={cycleBtn('yearly')}>
            Yearly
            <span className="text-xs opacity-90 ml-1">({YEARLY_BILLING_OFFER.shortLabel})</span>
          </button>
        </div>
        {billingCycle === 'yearly' && (
          <p className="text-xs text-green-600 dark:text-green-400">
            You pay 10 months · get 12 months on every plan below
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Building2
          const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
          const savings = yearlySavings(plan)
          const savingsPct = yearlySavingsPercent(plan)
          const perMonthYearly = yearlyPerMonth(plan)
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
              {billingCycle === 'yearly' && (
                <span className="absolute top-3 right-3 badge bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                  Save {fmtUGX(savings)}
                </span>
              )}
              <Icon className="text-[#2d6a4f] mb-2" size={28} />
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{plan.tagline}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{plan.bestFor}</p>

              <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold text-[#2d6a4f]">
                  {fmtUGX(displayPrice)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Monthly: {fmtUGX(plan.monthlyPrice)}/mo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yearly: {fmtUGX(plan.yearlyPrice)}/yr ({fmtUGX(perMonthYearly)}/mo)
                </p>
                {billingCycle === 'yearly' ? (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Save {fmtUGX(savings)} ({savingsPct}%) vs 12× monthly
                  </p>
                ) : (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Or {fmtUGX(plan.yearlyPrice)}/yr — save {fmtUGX(savings)}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 border-t dark:border-gray-700 pt-2">
                {formatUnitLimit(plan.unitLimit)} · {formatBuildingLimit(plan.buildingLimit)}
              </p>

              <ul className="mt-3 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <Check size={14} className="text-[#40916c] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <LoadingButton
                loading={loading === plan.id}
                disabled={isCurrent}
                onClick={() => {
                  setMomoReference('')
                  setConfirmPlan(plan)
                }}
                className={`mt-4 w-full py-2.5 rounded font-medium ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-default'
                    : plan.popular
                      ? 'bg-[#2d6a4f] text-white hover:opacity-90'
                      : 'border-2 border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10'
                }`}
              >
                {isCurrent ? 'Current Plan' : billingCycle === 'yearly' ? 'Choose yearly plan' : 'Choose monthly plan'}
              </LoadingButton>
            </div>
          )
        })}
      </div>

      {/* Full pricing table */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Full pricing comparison</h3>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="p-2">Plan</th>
                <th className="p-2">Monthly</th>
                <th className="p-2">12× monthly</th>
                <th className="p-2">Yearly price</th>
                <th className="p-2">Effective /mo (yearly)</th>
                <th className="p-2">You save</th>
                <th className="p-2">Units</th>
                <th className="p-2">Buildings</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <tr key={plan.id} className="border-b dark:border-gray-700">
                  <td className="p-2 font-medium">
                    {plan.name}
                    {plan.popular && (
                      <span className="ml-1 text-xs text-[#2d6a4f]">★</span>
                    )}
                  </td>
                  <td className="p-2">{fmtUGX(plan.monthlyPrice)}</td>
                  <td className="p-2 text-gray-500">{fmtUGX(annualMonthlyTotal(plan))}</td>
                  <td className="p-2 font-medium text-[#2d6a4f]">{fmtUGX(plan.yearlyPrice)}</td>
                  <td className="p-2">{fmtUGX(yearlyPerMonth(plan))}</td>
                  <td className="p-2 text-green-600 dark:text-green-400">
                    {fmtUGX(yearlySavings(plan))} ({yearlySavingsPercent(plan)}%)
                  </td>
                  <td className="p-2">{plan.unitLimit ?? '∞'}</td>
                  <td className="p-2">{plan.buildingLimit ?? '∞'}</td>
                </tr>
              ))}
              <tr className="bg-[#2d6a4f]/5 dark:bg-[#2d6a4f]/10">
                <td className="p-2 font-medium">{TRIAL_PLAN.name}</td>
                <td className="p-2" colSpan={7}>
                  Free for {TRIAL_PLAN.durationDays} days · {formatUnitLimit(TRIAL_PLAN.unitLimit)} · then pick monthly or yearly
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature matrix */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Feature comparison</h3>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2 text-gray-500 dark:text-gray-400">Feature</th>
                {SUBSCRIPTION_PLANS.map((p) => (
                  <th key={p.id} className="p-2 font-medium">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PLAN_FEATURES.map((feature) => (
                <tr key={feature} className="border-b dark:border-gray-700">
                  <td className="p-2 text-gray-600 dark:text-gray-300">{feature}</td>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <td key={plan.id} className="p-2 text-center">
                      {planHasFeature(plan, feature) ? (
                        <Check size={16} className="inline text-[#40916c]" />
                      ) : (
                        <X size={16} className="inline text-gray-300 dark:text-gray-600" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extra offers */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Gift size={18} /> Included offers & perks
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {BILLING_EXTRAS.map((extra) => (
            <div key={extra.id} className="p-3 border dark:border-gray-700 rounded-lg">
              <p className="font-medium text-[#2d6a4f]">{extra.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{extra.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to pay */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">How subscription payment works</h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center text-xs font-bold">1</span>
            <span>
              <strong>Choose plan & cycle</strong> — monthly or yearly (yearly = 2 months free).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center text-xs font-bold">2</span>
            <span>
              <strong>Send MoMo</strong> — open MTN MoMo, send the exact amount to <strong>{ADMIN_MOMO_LINE}</strong> with the reference shown.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center text-xs font-bold">3</span>
            <span>
              <strong>Enter reference & activate</strong> — paste your transaction ID; invoice goes to <strong>{customerEmail || 'your Gmail'}</strong>.
            </span>
          </li>
        </ol>
      </div>

      {/* FAQ */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <HelpCircle size={18} /> Billing FAQ
        </h3>
        <div className="space-y-2">
          {BILLING_FAQ.map((item, i) => (
            <div key={item.q} className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full text-left p-3 font-medium text-sm flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <span className="text-gray-400">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-300">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {paymentHistory.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText size={18} /> Billing history
          </h3>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="p-2">Date</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Cycle</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">MoMo ref</th>
                  <th className="p-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {[...paymentHistory].reverse().map((p) => {
                  const plan = getPlanById(p.planId)
                  const inv = findInvoiceForPayment(p, invoices)
                  return (
                    <tr key={p.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{p.date}</td>
                      <td className="p-2">{plan?.name || p.planId}</td>
                      <td className="p-2 capitalize">{p.billingCycle}</td>
                      <td className="p-2">{fmtUGX(p.amount)}</td>
                      <td className="p-2 font-mono text-xs">{p.reference}</td>
                      <td className="p-2">
                        {inv ? (
                          <button
                            type="button"
                            className="text-[#2d6a4f] underline"
                            onClick={() => downloadInvoice(inv)}
                          >
                            {inv.invoiceNo}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText size={18} /> Your invoices
          </h3>
          <div className="space-y-2">
            {[...invoices].reverse().map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap justify-between items-center gap-2 p-3 border dark:border-gray-700 rounded text-sm"
              >
                <div>
                  <p className="font-medium">{inv.invoiceNo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {inv.planName} · {inv.billingCycle} · {fmtUGX(inv.amount)} · {inv.date}
                  </p>
                  <p className="text-xs text-gray-400">
                    Period: {inv.periodStart} → {inv.periodEnd}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[#2d6a4f] underline font-medium"
                  onClick={() => downloadInvoice(inv)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {emailInbox.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Mail size={18} /> Invoice emails sent
          </h3>
          <div className="space-y-2 text-sm">
            {[...emailInbox].reverse().map((msg) => (
              <div key={msg.id} className="p-3 border dark:border-gray-700 rounded">
                <p className="font-medium">{msg.subject}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  To {msg.to} · {new Date(msg.sentAt).toLocaleString('en-UG')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setConfirmPlan(null)}
        >
          <div
            className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg">Pay & activate subscription</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {confirmPlan.name} — {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{confirmPlan.tagline}</p>

            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm space-y-1">
              <p className="text-2xl font-bold text-[#2d6a4f]">{fmtUGX(payAmount)}</p>
              {billingCycle === 'yearly' ? (
                <>
                  <p className="text-green-600 dark:text-green-400">
                    Yearly offer: save {fmtUGX(yearlySavings(confirmPlan))} ({yearlySavingsPercent(confirmPlan)}%)
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    vs {fmtUGX(annualMonthlyTotal(confirmPlan))} if paid monthly for 12 months
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Effective {fmtUGX(yearlyPerMonth(confirmPlan))}/month
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Or pay {fmtUGX(confirmPlan.yearlyPrice)}/year and save {fmtUGX(yearlySavings(confirmPlan))}
                </p>
              )}
            </div>

            <ul className="mt-3 text-xs space-y-1 text-gray-600 dark:text-gray-300">
              {confirmPlan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex gap-1">
                  <Check size={12} className="text-[#40916c] mt-0.5" /> {f}
                </li>
              ))}
            </ul>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-sm space-y-2">
              <p className="font-semibold">Step 1 — Send money now</p>
              <p>
                Open MTN MoMo and send <strong>{fmtUGX(payAmount)}</strong> to:
              </p>
              <p className="text-xl font-bold font-mono">{ADMIN_MOMO_LINE}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use reference: <strong>{payRefHint}</strong>
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Step 2 — Enter MoMo transaction reference
              </label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="e.g. 1234567890"
                value={momoReference}
                onChange={(e) => setMomoReference(e.target.value)}
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Step 3 — Invoice generated and sent to <strong>{customerEmail || 'your Google email'}</strong>.
            </p>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="flex-1 py-2 border rounded dark:border-gray-600"
                onClick={() => setConfirmPlan(null)}
              >
                Cancel
              </button>
              <LoadingButton
                loading={loading === confirmPlan.id}
                className="flex-1 py-2 bg-[#2d6a4f] text-white rounded"
                onClick={() => subscribe(confirmPlan)}
              >
                I have paid — activate
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
