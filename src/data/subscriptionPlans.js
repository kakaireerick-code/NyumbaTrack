/** Subscription bouquets — prices in UGX */
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
  },
]

export const TRIAL_PLAN = {
  id: 'trial',
  name: 'Free Trial',
  tagline: 'Try everything free for 14 days',
  durationDays: 14,
  unitLimit: 5,
  features: [
    'Full access to all features',
    'No credit card required',
    'Up to 5 units during trial',
    'One free trial per account',
    'Upgrade anytime during trial',
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
}

export const getPlanById = (id) => SUBSCRIPTION_PLANS.find((p) => p.id === id) || (id === 'trial' ? TRIAL_PLAN : null)

export const yearlySavings = (plan) => {
  if (!plan?.monthlyPrice) return 0
  return plan.monthlyPrice * 12 - plan.yearlyPrice
}
