import { describe, expect, it } from 'vitest'
import {
  SUBSCRIPTION_PLANS,
  YEARLY_BILLING_OFFER,
  annualMonthlyTotal,
  yearlyPerMonth,
  yearlySavings,
  yearlySavingsPercent,
} from '../data/subscriptionPlans'

describe('subscriptionPlans pricing', () => {
  it('yearly offer is 2 months free on all paid plans', () => {
    expect(YEARLY_BILLING_OFFER.monthsFree).toBe(2)
    for (const plan of SUBSCRIPTION_PLANS) {
      expect(yearlySavings(plan)).toBe(plan.monthlyPrice * 2)
      expect(yearlyPerMonth(plan)).toBe(Math.round(plan.yearlyPrice / 12))
    }
  })

  it('computes savings percent (~17%)', () => {
    const starter = SUBSCRIPTION_PLANS[0]
    expect(annualMonthlyTotal(starter)).toBe(240000)
    expect(yearlySavings(starter)).toBe(40000)
    expect(yearlySavingsPercent(starter)).toBe(17)
  })
})
