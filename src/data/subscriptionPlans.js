/** Subscription bouquets — prices in UGX */

export const YEARLY_BILLING_OFFER = {
  id: 'yearly-2-months-free',
  headline: 'Save 2 months with yearly billing',
  shortLabel: 'Save 2 months',
  description: 'Pay for 10 months upfront and get 12 months of access — equivalent to 2 months free on every plan.',
  monthsPaid: 10,
  monthsIncluded: 12,
  monthsFree: 2,
}

export const BILLING_EXTRAS = [
  {
    id: 'free-trial',
    title: '14-day free trial',
    detail: 'Full feature access for new owners. One trial per Google account. No MoMo payment required to start.',
  },
  {
    id: 'tenant-free',
    title: 'Tenants never pay',
    detail: 'Tenant portal, receipts, and messaging are free for your tenants — only property owners subscribe.',
  },
  {
    id: 'yearly-discount',
    title: 'Yearly discount on every plan',
    detail: 'Switch to yearly billing to save exactly 2 months of fees versus paying monthly for 12 months.',
  },
  {
    id: 'invoice-email',
    title: 'Instant invoice to Gmail',
    detail: 'After MoMo payment, your invoice is generated and sent to the Google email you signed in with.',
  },
  {
    id: 'upgrade-anytime',
    title: 'Upgrade or switch anytime',
    detail: 'Move from Starter to Growth (or any plan) during trial or after — pay the new plan via MoMo.',
  },
]

export const BILLING_FAQ = [
  {
    q: 'How do I pay for my subscription?',
    a: 'Send the plan amount to MTN MoMo 0793068911 (+256 793 068 911), then enter your transaction reference on the confirmation screen. Your plan activates immediately.',
  },
  {
    q: 'What is the yearly savings offer?',
    a: 'Yearly plans cost 10 months of the monthly price — you get 12 months of service. That is 2 months free on Starter, Growth, Professional, and Enterprise.',
  },
  {
    q: 'Do tenants need to pay?',
    a: 'No. Tenants join free via invite link. Only property owners pay for Nyumba-track.',
  },
  {
    q: 'Can I try before paying?',
    a: 'Yes. Start the 14-day free trial (sign in with Google). After the trial, pick monthly or yearly billing.',
  },
  {
    q: 'Where does my invoice go?',
    a: 'To the Gmail address on your Google sign-in. You can also download invoices from Billing history on this page.',
  },
]

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for small landlords',
    monthlyPrice: 20000,
    yearlyPrice: 200000,
    unitLimit: 5,
    buildingLimit: 1,
    features: [
      'Up to 5 units',
      '1 building',
      'Rent & payment tracking',
      'MTN MoMo reminders',
      'Basic reports',
      'Email support',
    ],
    popular: false,
    bestFor: '1 small building or a handful of rooms',
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Growing property portfolios',
    monthlyPrice: 50000,
    yearlyPrice: 500000,
    unitLimit: 25,
    buildingLimit: 3,
    features: [
      'Up to 25 units',
      'Up to 3 buildings',
      'MoMo reconciliation',
      'Legal notice generator',
      'Deposit management',
      'SMS reminders (AfricasTalking)',
    ],
    popular: true,
    bestFor: 'Landlords scaling to multiple properties',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Property managers & agents',
    monthlyPrice: 100000,
    yearlyPrice: 1000000,
    unitLimit: 50,
    buildingLimit: null,
    features: [
      'Up to 50 units',
      'Unlimited buildings',
      'Multi-user (Admin + Accountant)',
      'URA rental income reports',
      'Utility billing module',
      'Priority support',
    ],
    popular: false,
    bestFor: 'Agencies and professional property managers',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Large portfolios & developers',
    monthlyPrice: 200000,
    yearlyPrice: 2000000,
    unitLimit: null,
    buildingLimit: null,
    features: [
      'Unlimited units & buildings',
      'All roles (Caretaker, Tenant portal)',
      'Custom branding on documents',
      'Blacklist & tenant rating',
      'Dedicated account manager',
      'On-site training (Kampala)',
    ],
    popular: false,
    bestFor: 'Developers and large portfolio operators',
  },
]

export const TRIAL_PLAN = {
  id: 'trial',
  name: 'Free Trial',
  tagline: 'Try everything free for 14 days',
  durationDays: 14,
  unitLimit: 5,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    'Full access to all features',
    'No credit card required',
    'Up to 5 units during trial',
    'One free trial per account',
    'Upgrade anytime during trial',
    'Switch to monthly or yearly when you subscribe',
  ],
}

export const initialSubscription = {
  planId: null,
  billingCycle: 'monthly',
  status: 'none',
  trialStartedAt: null,
  trialEndsAt: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  hasUsedTrial: false,
  paymentHistory: [],
  invoices: [],
  emailInbox: [],
}

export const getPlanById = (id) =>
  SUBSCRIPTION_PLANS.find((p) => p.id === id) || (id === 'trial' ? TRIAL_PLAN : null)

/** Full price if paid monthly for 12 months */
export const annualMonthlyTotal = (plan) => (plan?.monthlyPrice || 0) * 12

export const yearlySavings = (plan) => {
  if (!plan?.monthlyPrice) return 0
  return annualMonthlyTotal(plan) - plan.yearlyPrice
}

export const yearlySavingsPercent = (plan) => {
  const full = annualMonthlyTotal(plan)
  if (!full) return 0
  return Math.round((yearlySavings(plan) / full) * 100)
}

export const yearlyPerMonth = (plan) => {
  if (!plan?.yearlyPrice) return 0
  return Math.round(plan.yearlyPrice / 12)
}

export const formatBuildingLimit = (limit) => {
  if (limit === null) return 'Unlimited'
  if (limit === 1) return '1 building'
  return `${limit} buildings`
}

export const formatUnitLimit = (limit) => {
  if (limit === null) return 'Unlimited'
  return `Up to ${limit} units`
}

export const ALL_PLAN_FEATURES = [
  ...new Set(SUBSCRIPTION_PLANS.flatMap((p) => p.features)),
]
