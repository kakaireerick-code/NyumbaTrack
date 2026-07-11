import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPartnerRewards,
  getReferralLink,
  getReferralShareMessage,
  savePartnerRewards,
  seedDemoPartnerReward,
} from './partnerRewards'

describe('partnerRewards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates a stable referral code per owner', () => {
    const a = getPartnerRewards('owner-1')
    const b = getPartnerRewards('owner-1')
    expect(a.referralCode).toBe(b.referralCode)
    expect(a.referralCode).toMatch(/^REF-/)
  })

  it('builds shareable referral link', () => {
    const link = getReferralLink('REF-TEST')
    expect(link).toContain('ref=REF-TEST')
    expect(link).toContain('/login')
  })

  it('includes code in WhatsApp message', () => {
    const msg = getReferralShareMessage('REF-ABCD', 'Erik')
    expect(msg).toContain('REF-ABCD')
    expect(msg).toContain('NyumbaTrack')
  })

  it('persists banked months', () => {
    const base = getPartnerRewards('owner-2')
    savePartnerRewards({ ...base, bankedMonths: 2, successfulReferrals: 2 })
    expect(getPartnerRewards('owner-2').bankedMonths).toBe(2)
  })

  it('seedDemoPartnerReward banks at least one month', () => {
    const s = seedDemoPartnerReward('owner-3')
    expect(s.bankedMonths).toBeGreaterThanOrEqual(1)
  })
})
