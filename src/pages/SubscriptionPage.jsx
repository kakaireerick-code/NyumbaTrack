import React, { useState } from 'react'
import { Check, Sparkles, Crown, Building2, Zap, Smartphone, FileText } from 'lucide-react'
import { fmtUGX } from '../utils/helpers'
import {
  SUBSCRIPTION_PLANS,
  TRIAL_PLAN,
  yearlySavings,
  getPlanById,
} from '../data/subscriptionPlans'
import {
  isSubscriptionActive,
  daysRemaining,
  getSubscriptionLabel,
  getActiveEndDate,
} from '../utils/subscription'
import { ADMIN_MOMO_LINE, ADMIN_MOMO_DISPLAY, subscriptionPaymentReference } from '../lib/billing'
import { verifyMomoReference, collectSubscriptionReferences } from '../lib/momoVerification'
import { buildSubscriptionInvoice, queueInvoiceEmail, downloadInvoice } from '../lib/subscriptionInvoice'
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

export default function SubscriptionPage({
  subscription,
  setSubscription,
  showToast,
  units,
  currentUser,
  authUser,
  settings = {},
}) {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [confirmPlan, setConfirmPlan] = useState(null)
  const [momoReference, setMomoReference] = useState('')
  const [latestInvoice, setLatestInvoice] = useState(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const customerEmail = authUser?.email || currentUser?.email || ''
  const customerName = authUser?.name || currentUser?.name || 'Customer'

  const active = isSubscriptionActive(subscription)
  const endDate = getActiveEndDate(subscription)
  const daysLeft = daysRemaining(endDate)
  const paymentHistory = subscription.paymentHistory || []
  const invoices = subscription.invoices || []

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

  const subscribe = (plan) => {
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
    setTimeout(() => {
      const now = new Date()
      const ends = new Date(now)
      if (billingCycle === 'yearly') ends.setFullYear(ends.getFullYear() + 1)
      else ends.setMonth(ends.getMonth() + 1)

      const paymentRecord = {
        id: `sub-${Date.now()}`,
        planId: plan.id,
        billingCycle,
        amount,
        date: now.toISOString().split('T')[0],
        method: 'MTN MoMo',
        reference: ref,
        paidTo: ADMIN_MOMO_LINE,
      }

      const invoice = buildSubscriptionInvoice({
        customerName,
        customerEmail,
        planId: plan.id,
        billingCycle,
        amount,
        momoReference: ref,
        periodStart: now.toISOString().split('T')[0],
        periodEnd: ends.toISOString().split('T')[0],
        existingInvoices: invoices,
      })

      const emailInbox = queueInvoiceEmail(invoice, subscription.emailInbox || [])

      setSubscription({
        ...subscription,
        planId: plan.id,
        billingCycle,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: ends.toISOString(),
        paymentHistory: [...paymentHistory, paymentRecord],
        invoices: [...invoices, invoice],
        emailInbox,
      })

      setLatestInvoice(invoice)
      setEmailSent(true)
      setInvoiceModalOpen(true)
      setConfirmPlan(null)
      setMomoReference('')
      showToast(`Subscribed! Invoice sent to ${customerEmail}`, 'success')
      setLoading(null)
    }, 800)
  }

  const payAmount = confirmPlan
    ? billingCycle === 'yearly'
      ? confirmPlan.yearlyPrice
      : confirmPlan.monthlyPrice
    : 0

  const payRefHint = confirmPlan
    ? subscriptionPaymentReference(confirmPlan.id, customerName)
    : ''

  const cycleBtn = (cycle) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      billingCycle === cycle
        ? 'bg-[#2d6a4f] text-white'
        : 'text-gray-600 dark:text-gray-300'
    }`

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      <SubscriptionInvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={latestInvoice}
        emailSent={emailSent}
      />

      <div className="text-center">
        <h1 className="text-2xl font-bold">Plans & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your NyumbaTrack subscription — pay via MTN MoMo after your free trial
        </p>
        {authUser?.authProvider === 'google' && (
          <p className="text-sm text-[#2d6a4f] mt-2">
            Signed in as {customerEmail} — invoices go to this Gmail
          </p>
        )}
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
              {units?.length || 0} units in use
              {subscription.billingCycle ? ` · Billed ${subscription.billingCycle}` : ''}
            </p>
          </div>
          {subscription.status === 'trialing' && <Badge color="green">Free Trial Active</Badge>}
          {subscription.status === 'active' && <Badge color="blue">Active Plan</Badge>}
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
                {TRIAL_PLAN.tagline}. After {TRIAL_PLAN.durationDays} days, subscribe via MTN MoMo to continue.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
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
            Your free trial has ended. Choose a plan below and pay to{' '}
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
        {settings.airtelMoney && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Airtel Money (optional): <strong>{settings.airtelMoney}</strong>
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          All subscription payments must be sent to the MTN MoMo number above. You will receive an
          invoice to your Google email automatically after confirming your transaction reference.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border dark:border-gray-600 p-1 bg-white dark:bg-gray-800">
          <button type="button" onClick={() => setBillingCycle('monthly')} className={cycleBtn('monthly')}>
            Monthly
          </button>
          <button type="button" onClick={() => setBillingCycle('yearly')} className={cycleBtn('yearly')}>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{plan.tagline}</p>
              <p className="text-2xl font-bold text-[#2d6a4f]">
                {fmtUGX(price)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </p>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {fmtUGX(perMonth)}/mo · Save {fmtUGX(savings)}
                </p>
              )}
              {plan.unitLimit && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Up to {plan.unitLimit} units
                  {plan.buildingLimit ? ` · ${plan.buildingLimit} building${plan.buildingLimit > 1 ? 's' : ''}` : plan.buildingLimit === null ? ' · Unlimited buildings' : ''}
                </p>
              )}
              {!plan.unitLimit && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Unlimited units & buildings</p>
              )}
              <ul className="mt-4 space-y-2 text-sm flex-1">
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
                {isCurrent ? 'Current Plan' : 'Choose Plan'}
              </LoadingButton>
            </div>
          )
        })}
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

      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setConfirmPlan(null)}
        >
          <div
            className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg">Pay & activate subscription</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {confirmPlan.name} — {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{confirmPlan.tagline}</p>
            <p className="text-2xl font-bold text-[#2d6a4f] mt-2">{fmtUGX(payAmount)}</p>

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
              Step 3 — After confirming, your invoice is generated and sent to{' '}
              <strong>{customerEmail || 'your Google email'}</strong>.
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
