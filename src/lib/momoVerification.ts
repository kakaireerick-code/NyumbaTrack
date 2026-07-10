/** MTN MoMo transaction reference validation for subscription payments */

export type MomoVerifyResult = { ok: true } | { ok: false; error: string }

const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-_.]{5,31}$/

export const normalizeMomoReference = (ref: string): string =>
  String(ref || '').trim().replace(/\s+/g, '')

export const verifyMomoReference = (
  ref: string,
  existingReferences: string[] = [],
): MomoVerifyResult => {
  const norm = normalizeMomoReference(ref)
  if (!norm || norm.length < 6) {
    return { ok: false, error: 'Enter a valid MoMo transaction reference (at least 6 characters).' }
  }
  if (!REF_PATTERN.test(norm)) {
    return { ok: false, error: 'Reference should contain only letters, numbers, dashes, or underscores.' }
  }
  const used = new Set(existingReferences.map((r) => normalizeMomoReference(r).toLowerCase()))
  if (used.has(norm.toLowerCase())) {
    return { ok: false, error: 'This transaction reference was already used. Check your MoMo SMS.' }
  }
  return { ok: true }
}

export const collectSubscriptionReferences = (
  paymentHistory: Array<{ reference?: string }> = [],
): string[] => paymentHistory.map((p) => p.reference || '').filter(Boolean)
