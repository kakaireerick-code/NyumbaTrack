import { safeGet, safeSet } from './storage'

export type PartnerRewardsState = {
  ownerId: string
  referralCode: string
  bankedMonths: number
  successfulReferrals: number
  pendingReferrals: number
}

const KEY = (ownerId: string) => `rt_partner_rewards_${ownerId}`

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

export const getPartnerRewards = (ownerId: string): PartnerRewardsState => {
  const stored = safeGet<PartnerRewardsState | null>(KEY(ownerId), null)
  if (stored?.referralCode) return { ...stored, ownerId }
  const record: PartnerRewardsState = {
    ownerId,
    referralCode: `REF-${randomSuffix(4)}`,
    bankedMonths: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
  }
  safeSet(KEY(ownerId), record)
  return record
}

export const savePartnerRewards = (state: PartnerRewardsState): void => {
  safeSet(KEY(state.ownerId), state)
}

export const getReferralLink = (code: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nyumbatracker.vercel.app'
  return `${origin}/login?ref=${encodeURIComponent(code)}`
}

export const getReferralShareMessage = (code: string, name = 'A landlord'): string => {
  const link = getReferralLink(code)
  return `${name} uses NyumbaTrack to manage rent in Uganda. Join with my Partner Rewards link: ${link} (code ${code}). Complete your first owner login and we both earn discounted billing months.`
}

/** Demo / training — bank one month for UI practice */
export const seedDemoPartnerReward = (ownerId: string): PartnerRewardsState => {
  const base = getPartnerRewards(ownerId)
  const demo: PartnerRewardsState = {
    ...base,
    bankedMonths: Math.max(base.bankedMonths, 1),
    successfulReferrals: Math.max(base.successfulReferrals, 1),
  }
  savePartnerRewards(demo)
  return demo
}
