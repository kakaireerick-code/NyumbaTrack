export type StoredClaim = {
  id: string
  customerEmail: string
  customerName: string
  ownerId?: string
  planId: string
  billingCycle: string
  amount: number
  momoReference: string
  status: string
  submittedAt: string
  reviewedAt?: string
  reviewNote?: string
}

export const parseReviewBody = (body: Record<string, unknown>): {
  action: 'approve' | 'reject' | ''
  momoReference: string
  note: string
} => {
  const action = body.action === 'reject' ? 'reject' : body.action === 'approve' ? 'approve' : ''
  const momoReference = String(body.momoReference || '').trim()
  const note = String(body.note || '').trim()
  return { action, momoReference, note }
}

export const applyReview = (
  existing: StoredClaim,
  action: 'approve' | 'reject',
  note: string,
): StoredClaim => ({
  ...existing,
  status: action === 'approve' ? 'approved' : 'rejected',
  reviewedAt: new Date().toISOString(),
  reviewNote: note || undefined,
})

export const sortClaimsNewestFirst = (claims: StoredClaim[]) =>
  [...claims].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))

export const validateClaimPayload = (body: Record<string, unknown>) => {
  const customerEmail = String(body.customerEmail || '').trim().toLowerCase()
  const momoReference = String(body.momoReference || '').trim()
  const planId = String(body.planId || '').trim()
  const billingCycle = String(body.billingCycle || 'monthly').trim()
  const amount = Number(body.amount || 0)
  const ok = Boolean(customerEmail && momoReference && momoReference.length >= 6 && planId && amount)
  return { ok, customerEmail, momoReference, planId, billingCycle, amount }
}
