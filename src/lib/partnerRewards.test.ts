import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPartnerRewards,
  getReferralLink,
  getReferralShareMessage,
  savePartnerRewards,
  seedDemoPartnerReward,
  captureReferralFromUrl,
  stashReferralCode,
  clearStashedReferralCode,
  recordReferralSignup,
  processReferrerCreditOnFirstLogin,
  applyPartnerCreditToAmount,
  markReferralLinkShared,
  CREDIT_PERCENT_PER_REFERRAL,
  MAX_CREDIT_PERCENT,
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
    expect(msg).toContain('15%')
  })

  it('persists credit percent and notes', () => {
    const base = getPartnerRewards('owner-2')
    savePartnerRewards({
      ...base,
      creditPercent: 30,
      bankedMonths: 2,
      successfulReferrals: 2,
      creditNotes: [
        {
          id: 'cn-1',
          date: '2026-07-11',
          percent: 15,
          note: 'Test',
          referralId: 'ref-1',
        },
      ],
    })
    expect(getPartnerRewards('owner-2').creditPercent).toBe(30)
    expect(getPartnerRewards('owner-2').creditNotes).toHaveLength(1)
  })

  it('seedDemoPartnerReward banks credit and steps', () => {
    const s = seedDemoPartnerReward('owner-3')
    expect(s.creditPercent).toBeGreaterThanOrEqual(15)
    expect(s.referrals[0]?.steps.every((step) => step.done)).toBe(true)
  })

  it('stashes referral code from URL', () => {
    stashReferralCode('REF-ABC1')
    expect(localStorage.getItem('rt_pending_ref_code')).toContain('REF-ABC1')
    clearStashedReferralCode()
  })

  it('records signup against referrer and credits on first login', () => {
    const referrer = getPartnerRewards('referrer-1')
    const code = referrer.referralCode
    stashReferralCode(code)

    const signup = recordReferralSignup('new-owner-1', 'new@landlord.ug', 'New Owner')
    expect(signup.referrerOwnerId).toBe('referrer-1')

    const refState = getPartnerRewards('referrer-1')
    expect(refState.pendingReferrals).toBeGreaterThanOrEqual(1)

    const credit = processReferrerCreditOnFirstLogin('new-owner-1', 'New Owner', 'new@landlord.ug')
    expect(credit.applied).toBe(true)
    expect(credit.creditPercent).toBe(CREDIT_PERCENT_PER_REFERRAL)

    const after = getPartnerRewards('referrer-1')
    expect(after.creditPercent).toBe(15)
    expect(after.creditNotes[0]?.percent).toBe(15)
    expect(after.referrals[0]?.steps.find((s) => s.id === 'credited')?.done).toBe(true)
  })

  it('caps total credit at 45%', () => {
    const referrer = getPartnerRewards('referrer-cap')
    savePartnerRewards({
      ...referrer,
      creditPercent: 40,
      referrals: [],
      creditNotes: [],
    })

    stashReferralCode(referrer.referralCode)
    recordReferralSignup('o2', 'a@x.ug', 'A')
    processReferrerCreditOnFirstLogin('o2', 'A', 'a@x.ug')

    stashReferralCode(referrer.referralCode)
    recordReferralSignup('o3', 'b@x.ug', 'B')
    processReferrerCreditOnFirstLogin('o3', 'B', 'b@x.ug')

    expect(getPartnerRewards('referrer-cap').creditPercent).toBe(MAX_CREDIT_PERCENT)
  })

  it('applyPartnerCreditToAmount discounts invoice total', () => {
    const result = applyPartnerCreditToAmount(100000, 15)
    expect(result.discount).toBe(15000)
    expect(result.total).toBe(85000)
  })

  it('markReferralLinkShared tracks link_shared step', () => {
    const next = markReferralLinkShared('owner-share')
    expect(next.referrals[0]?.steps.find((s) => s.id === 'link_shared')?.done).toBe(true)
  })
})
