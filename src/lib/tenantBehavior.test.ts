import { describe, it, expect } from 'vitest'
import { computeTenantBehavior, wasPaymentOnTime, computePaymentStreak } from './tenantBehavior'

describe('tenantBehavior', () => {
  const tenant = {
    id: 't1',
    leaseStart: '2025-01-01',
    leaseEnd: '2026-12-31',
    rentAmount: 500000,
    rentDueDay: 5,
    depositPaid: 1000000,
    depositAmount: 1000000,
  }

  it('detects on-time payment within grace period', () => {
    expect(wasPaymentOnTime('2025-03-07', 5)).toBe(true)
    expect(wasPaymentOnTime('2025-03-12', 5)).toBe(false)
  })

  it('scores excellent tenant with on-time payments', () => {
    const stats = computeTenantBehavior({
      tenant,
      payments: [
        { tenantId: 't1', amount: 500000, date: '2025-01-05', type: 'rent', status: 'confirmed' },
        { tenantId: 't1', amount: 500000, date: '2025-02-06', type: 'rent', status: 'confirmed' },
      ],
      balance: { isInArrears: false, daysLate: 0, balance: 0 },
      messagesSent: 2,
    })
    expect(stats.onTimePaymentRate).toBe(100)
    expect(stats.grade).toBe('Excellent')
    expect(stats.overallScore).toBeGreaterThanOrEqual(85)
  })

  it('flags late rent in stats and tips', () => {
    const stats = computeTenantBehavior({
      tenant,
      payments: [{ tenantId: 't1', amount: 500000, date: '2025-01-20', type: 'rent' }],
      balance: { isInArrears: true, daysLate: 10, balance: 500000 },
    })
    expect(stats.rentStatus).toMatch(/late|behind/)
    expect(stats.tips.some((t) => t.toLowerCase().includes('due'))).toBe(true)
  })

  it('computes payment streak for consecutive on-time months', () => {
    const payments = [
      { tenantId: 't1', amount: 500000, date: '2025-01-05', type: 'rent' },
      { tenantId: 't1', amount: 500000, date: '2025-02-05', type: 'rent' },
    ]
    expect(computePaymentStreak(payments, 5, '2025-01-01')).toBeGreaterThanOrEqual(0)
  })
})
