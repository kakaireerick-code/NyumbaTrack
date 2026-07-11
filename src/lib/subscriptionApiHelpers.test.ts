import { describe, expect, it } from 'vitest'
import {
  applyReview,
  parseReviewBody,
  sortClaimsNewestFirst,
  validateClaimPayload,
} from './subscriptionApiHelpers'

describe('subscriptionApiHelpers', () => {
  it('parses review body', () => {
    expect(parseReviewBody({ action: 'approve', momoReference: 'ABC123' })).toEqual({
      action: 'approve',
      momoReference: 'ABC123',
      note: '',
    })
    expect(parseReviewBody({ action: 'nope', momoReference: 'x' }).action).toBe('')
  })

  it('applies approve and reject reviews', () => {
    const base = {
      id: 'c1',
      customerEmail: 'a@b.com',
      customerName: 'A',
      planId: 'starter',
      billingCycle: 'monthly',
      amount: 1000,
      momoReference: 'REF1',
      status: 'pending_verification',
      submittedAt: '2026-07-11T00:00:00Z',
    }
    const approved = applyReview(base, 'approve', '')
    expect(approved.status).toBe('approved')
    expect(approved.reviewedAt).toBeTruthy()
    const rejected = applyReview(base, 'reject', 'duplicate payment')
    expect(rejected.status).toBe('rejected')
    expect(rejected.reviewNote).toBe('duplicate payment')
  })

  it('sorts claims newest first', () => {
    const rows = sortClaimsNewestFirst([
      {
        id: '1',
        customerEmail: 'a',
        customerName: 'A',
        planId: 'p',
        billingCycle: 'm',
        amount: 1,
        momoReference: 'R1',
        status: 'pending_verification',
        submittedAt: '2026-07-10T00:00:00Z',
      },
      {
        id: '2',
        customerEmail: 'b',
        customerName: 'B',
        planId: 'p',
        billingCycle: 'm',
        amount: 1,
        momoReference: 'R2',
        status: 'pending_verification',
        submittedAt: '2026-07-11T00:00:00Z',
      },
    ])
    expect(rows[0].momoReference).toBe('R2')
  })

  it('validates claim payload', () => {
    expect(
      validateClaimPayload({
        customerEmail: 'x@y.com',
        momoReference: 'NYUMBA123',
        planId: 'growth',
        amount: 49000,
      }).ok,
    ).toBe(true)
    expect(validateClaimPayload({ customerEmail: '', momoReference: 'x' }).ok).toBe(false)
  })
})
