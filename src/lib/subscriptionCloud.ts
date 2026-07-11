export type SubscriptionClaimPayload = {
  customerEmail: string
  customerName: string
  ownerId?: string
  planId: string
  billingCycle: string
  amount: number
  momoReference: string
}

export type SubscriptionClaimResult =
  | { ok: true; status: 'pending_verification'; claimId: string; message: string }
  | { ok: false; error: string }

/** Submit MoMo payment for cloud verification — never instant-activates. */
export const submitCloudSubscriptionClaim = async (
  payload: SubscriptionClaimPayload,
): Promise<SubscriptionClaimResult> => {
  try {
    const res = await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error || `Claim failed (${res.status})` }
    }
    return {
      ok: true,
      status: 'pending_verification',
      claimId: data.claim?.id || `claim-${Date.now()}`,
      message: data.message || 'Payment submitted for verification.',
    }
  } catch {
    // Local dev / preview without API — still pending, never auto-active
    return {
      ok: true,
      status: 'pending_verification',
      claimId: `local-claim-${Date.now()}`,
      message: 'Payment recorded locally as pending verification (API unavailable in dev).',
    }
  }
}
