export type BillingClaim = {
  id: string
  customerEmail: string
  customerName: string
  planId: string
  billingCycle: string
  amount: number
  momoReference: string
  status: string
  submittedAt: string
  reviewedAt?: string
  reviewNote?: string
}

const authHeaders = (secret: string) => ({
  Authorization: `Bearer ${secret}`,
  'Content-Type': 'application/json',
})

export const isBillingAdminEmail = (email: string | undefined | null): boolean => {
  const admin = String(import.meta.env.VITE_BILLING_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!admin) return false
  return String(email || '').trim().toLowerCase() === admin
}

export const fetchPendingClaims = async (secret: string): Promise<BillingClaim[]> => {
  const res = await fetch('/api/subscription', { headers: authHeaders(secret) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `List failed (${res.status})`)
  return Array.isArray(data.claims) ? data.claims : []
}

export const reviewClaim = async (
  secret: string,
  momoReference: string,
  action: 'approve' | 'reject',
  note = '',
): Promise<BillingClaim> => {
  const res = await fetch('/api/subscription', {
    method: 'PATCH',
    headers: authHeaders(secret),
    body: JSON.stringify({ action, momoReference, note }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Review failed (${res.status})`)
  return data.claim as BillingClaim
}

/** sessionStorage key — cleared when browser session ends */
export const BILLING_ADMIN_SECRET_KEY = 'nyumba_billing_admin_secret'
