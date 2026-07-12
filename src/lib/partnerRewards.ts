import { safeGet, safeSet } from './storage'

export const CREDIT_PERCENT_PER_REFERRAL = 15
export const MAX_CREDIT_PERCENT = 45

export type ReferralStepId = 'link_shared' | 'signed_up' | 'first_login' | 'credited'

export type ReferralStep = {
  id: ReferralStepId
  label: string
  done: boolean
  at?: string | null
}

export type ReferralRecord = {
  id: string
  referredOwnerId?: string
  referredEmail?: string
  referredName?: string
  steps: ReferralStep[]
  creditPercent: number
  status: 'pending' | 'qualified' | 'credited'
  createdAt: string
  qualifiedAt?: string | null
}

export type CreditNote = {
  id: string
  date: string
  percent: number
  note: string
  referralId: string
  referredName?: string
}

export type PartnerRewardsState = {
  ownerId: string
  referralCode: string
  bankedMonths: number
  creditPercent: number
  successfulReferrals: number
  pendingReferrals: number
  referrals: ReferralRecord[]
  creditNotes: CreditNote[]
}

const KEY = (ownerId: string) => `rt_partner_rewards_${ownerId}`
const STASH_KEY = 'rt_pending_ref_code'
const SEEN_KEY = (ownerId: string) => `rt_owner_seen_${ownerId}`
const REFERRER_KEY = (referredOwnerId: string) => `rt_referred_by_${referredOwnerId}`

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const randomSuffix = (len = 4): string => {
  const bytes = new Uint8Array(len)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[bytes[i] % CHARS.length]
  return s
}

const defaultSteps = (opts: { linkShared?: boolean; signedUp?: boolean } = {}): ReferralStep[] => [
  {
    id: 'link_shared',
    label: 'Link shared',
    done: !!opts.linkShared,
    at: opts.linkShared ? new Date().toISOString() : null,
  },
  {
    id: 'signed_up',
    label: 'Owner signed up',
    done: !!opts.signedUp,
    at: opts.signedUp ? new Date().toISOString() : null,
  },
  { id: 'first_login', label: 'First login complete', done: false, at: null },
  { id: 'credited', label: 'Credit applied', done: false, at: null },
]

const normalizeState = (ownerId: string, raw: Partial<PartnerRewardsState> | null): PartnerRewardsState => ({
  ownerId,
  referralCode: raw?.referralCode || `REF-${randomSuffix(4)}`,
  bankedMonths: raw?.bankedMonths ?? 0,
  creditPercent: Math.min(MAX_CREDIT_PERCENT, raw?.creditPercent ?? 0),
  successfulReferrals: raw?.successfulReferrals ?? 0,
  pendingReferrals: raw?.pendingReferrals ?? 0,
  referrals: raw?.referrals ?? [],
  creditNotes: raw?.creditNotes ?? [],
})

export const getPartnerRewards = (ownerId: string): PartnerRewardsState => {
  const stored = safeGet<Partial<PartnerRewardsState> | null>(KEY(ownerId), null)
  if (stored?.referralCode) return normalizeState(ownerId, stored)
  const record = normalizeState(ownerId, null)
  safeSet(KEY(ownerId), record)
  return record
}

export const savePartnerRewards = (state: PartnerRewardsState): void => {
  safeSet(KEY(state.ownerId), {
    ...state,
    creditPercent: Math.min(MAX_CREDIT_PERCENT, state.creditPercent),
  })
}

export const findReferrerOwnerIdByCode = (code: string): string | null => {
  const norm = String(code || '').trim().toUpperCase()
  if (!norm) return null
  if (typeof localStorage === 'undefined') return null
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith('rt_partner_rewards_')) continue
    const ownerId = k.slice('rt_partner_rewards_'.length)
    const state = getPartnerRewards(ownerId)
    if (state.referralCode.toUpperCase() === norm) return ownerId
  }
  return null
}

export const parseReferralCodeFromLocation = (
  search = typeof window !== 'undefined' ? window.location.search : '',
): string => {
  const params = new URLSearchParams(search)
  return String(params.get('ref') || '').trim().toUpperCase()
}

export const stashReferralCode = (code: string): void => {
  const norm = String(code || '').trim().toUpperCase()
  if (!norm) return
  safeSet(STASH_KEY, norm)
}

export const peekStashedReferralCode = (): string =>
  String(safeGet<string>(STASH_KEY, '') || '').trim().toUpperCase()

export const clearStashedReferralCode = (): void => safeSet(STASH_KEY, '')

export const captureReferralFromUrl = (): string => {
  const code = parseReferralCodeFromLocation()
  if (code) stashReferralCode(code)
  return code
}

export const markReferralLinkShared = (ownerId: string): PartnerRewardsState => {
  const state = getPartnerRewards(ownerId)
  const draft = state.referrals.find((r) => r.status === 'pending' && !r.referredOwnerId)
  if (draft) {
    const steps = draft.steps.map((s) =>
      s.id === 'link_shared' ? { ...s, done: true, at: new Date().toISOString() } : s,
    )
    const referrals = state.referrals.map((r) => (r.id === draft.id ? { ...r, steps } : r))
    const next = { ...state, referrals }
    savePartnerRewards(next)
    return next
  }
  const record: ReferralRecord = {
    id: `ref-${Date.now()}`,
    steps: defaultSteps({ linkShared: true }),
    creditPercent: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const next = { ...state, referrals: [record, ...state.referrals] }
  savePartnerRewards(next)
  return next
}

export const recordReferralSignup = (
  referredOwnerId: string,
  email: string,
  name: string,
): { credited: boolean; referrerOwnerId?: string } => {
  const code = peekStashedReferralCode()
  if (!code) return { credited: false }
  const referrerOwnerId = findReferrerOwnerIdByCode(code)
  clearStashedReferralCode()
  if (!referrerOwnerId || referrerOwnerId === referredOwnerId) return { credited: false }

  safeSet(REFERRER_KEY(referredOwnerId), referrerOwnerId)
  const referrer = getPartnerRewards(referrerOwnerId)
  const now = new Date().toISOString()

  let referrals = [...referrer.referrals]
  const open = referrals.find((r) => r.status === 'pending' && !r.referredOwnerId)
  const record: ReferralRecord = open
    ? {
        ...open,
        referredOwnerId,
        referredEmail: email,
        referredName: name,
        steps: open.steps.map((s) =>
          s.id === 'signed_up' ? { ...s, done: true, at: now } : s.id === 'link_shared' && !s.done ? { ...s, done: true, at: now } : s,
        ),
      }
    : {
        id: `ref-${Date.now()}`,
        referredOwnerId,
        referredEmail: email,
        referredName: name,
        steps: defaultSteps({ linkShared: true, signedUp: true }),
        creditPercent: 0,
        status: 'pending',
        createdAt: now,
      }

  referrals = open
    ? referrals.map((r) => (r.id === open.id ? record : r))
    : [record, ...referrals]

  const next: PartnerRewardsState = {
    ...referrer,
    referrals,
    pendingReferrals: referrer.pendingReferrals + (open ? 0 : 1),
  }
  savePartnerRewards(next)
  return { credited: false, referrerOwnerId }
}

export const applyReferralCredit = (
  referrerOwnerId: string,
  referralId: string,
  referredName: string,
): PartnerRewardsState | null => {
  const state = getPartnerRewards(referrerOwnerId)
  if (state.creditPercent >= MAX_CREDIT_PERCENT) return null

  const referral = state.referrals.find((r) => r.id === referralId)
  if (!referral || referral.status === 'credited') return null

  const add = Math.min(CREDIT_PERCENT_PER_REFERRAL, MAX_CREDIT_PERCENT - state.creditPercent)
  const now = new Date().toISOString()
  const note: CreditNote = {
    id: `cn-${Date.now()}`,
    date: now.split('T')[0],
    percent: add,
    note: `Partner Rewards: +${add}% billing credit — ${referredName || 'referred owner'} completed first login.`,
    referralId,
    referredName,
  }

  const referrals = state.referrals.map((r) =>
    r.id === referralId
      ? {
          ...r,
          status: 'credited' as const,
          creditPercent: add,
          qualifiedAt: now,
          steps: r.steps.map((s) => ({
            ...s,
            done: true,
            at: s.at || now,
          })),
        }
      : r,
  )

  const next: PartnerRewardsState = {
    ...state,
    referrals,
    creditPercent: state.creditPercent + add,
    bankedMonths: state.bankedMonths + (add >= 15 ? 1 : 0),
    successfulReferrals: state.successfulReferrals + 1,
    pendingReferrals: Math.max(0, state.pendingReferrals - 1),
    creditNotes: [note, ...state.creditNotes],
  }
  savePartnerRewards(next)
  return next
}

export const processReferrerCreditOnFirstLogin = (
  referredOwnerId: string,
  referredName: string,
  referredEmail: string,
): { applied: boolean; creditPercent?: number } => {
  if (safeGet<boolean>(SEEN_KEY(referredOwnerId), false)) {
    return { applied: false }
  }
  safeSet(SEEN_KEY(referredOwnerId), true)

  const referrerOwnerId = safeGet<string | null>(REFERRER_KEY(referredOwnerId), null)
  if (!referrerOwnerId) return { applied: false }

  const referrer = getPartnerRewards(referrerOwnerId)
  const referral =
    referrer.referrals.find((r) => r.referredOwnerId === referredOwnerId) ||
    referrer.referrals.find((r) => r.status === 'pending' && r.referredEmail === referredEmail)

  if (!referral) return { applied: false }

  const now = new Date().toISOString()
  let referrals = referrer.referrals.map((r) =>
    r.id === referral.id
      ? {
          ...r,
          referredOwnerId,
          referredName,
          referredEmail,
          status: 'qualified' as const,
          qualifiedAt: now,
          steps: r.steps.map((s) =>
            s.id === 'first_login' ? { ...s, done: true, at: now } : s,
          ),
        }
      : r,
  )

  savePartnerRewards({ ...referrer, referrals })
  const credited = applyReferralCredit(referrerOwnerId, referral.id, referredName)
  return credited
    ? { applied: true, creditPercent: credited.creditPercent }
    : { applied: false }
}

export const applyPartnerCreditToAmount = (amount: number, creditPercent: number): {
  original: number
  discount: number
  total: number
  creditPercent: number
} => {
  const pct = Math.min(MAX_CREDIT_PERCENT, Math.max(0, creditPercent))
  const discount = Math.round((amount * pct) / 100)
  return {
    original: amount,
    discount,
    total: Math.max(0, amount - discount),
    creditPercent: pct,
  }
}

export const formatCreditSummary = (state: PartnerRewardsState): string => {
  if (state.creditPercent <= 0) return 'No Partner Rewards credit yet — share your link.'
  return `${state.creditPercent}% billing credit active (max ${MAX_CREDIT_PERCENT}%). ${state.creditNotes.length} credit note(s) on file.`
}

export const getReferralLink = (code: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nyumbatracker.vercel.app'
  return `${origin}/login?ref=${encodeURIComponent(code)}`
}

export const getReferralShareMessage = (code: string, name = 'A landlord'): string => {
  const link = getReferralLink(code)
  return `${name} uses Nyumba-track to manage rent in Uganda. Join with my Partner Rewards link: ${link} (code ${code}). Complete your first owner login — I earn 15% billing credit (up to 45%).`
}

/** Demo / training — bank one month for UI practice */
export const seedDemoPartnerReward = (ownerId: string): PartnerRewardsState => {
  const base = getPartnerRewards(ownerId)
  const demo: PartnerRewardsState = {
    ...base,
    bankedMonths: Math.max(base.bankedMonths, 1),
    creditPercent: Math.max(base.creditPercent, 15),
    successfulReferrals: Math.max(base.successfulReferrals, 1),
    referrals: base.referrals.length
      ? base.referrals
      : [
          {
            id: 'ref-demo',
            referredName: 'Demo Landlord',
            referredEmail: 'demo@landlord.ug',
            steps: defaultSteps({ linkShared: true, signedUp: true }).map((s) => ({
              ...s,
              done: true,
              at: new Date().toISOString(),
            })),
            creditPercent: 15,
            status: 'credited',
            createdAt: new Date().toISOString(),
            qualifiedAt: new Date().toISOString(),
          },
        ],
    creditNotes: base.creditNotes.length
      ? base.creditNotes
      : [
          {
            id: 'cn-demo',
            date: new Date().toISOString().split('T')[0],
            percent: 15,
            note: 'Partner Rewards: +15% billing credit — Demo Landlord completed first login.',
            referralId: 'ref-demo',
            referredName: 'Demo Landlord',
          },
        ],
  }
  savePartnerRewards(demo)
  return demo
}
