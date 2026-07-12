/** Nyumba-track app owner — subscription payments go here */
export const ADMIN_MOMO_LINE = '0793068911'
export const ADMIN_MOMO_DISPLAY = '+256 793 068 911'
export const ADMIN_MOMO_WA = '256793068911'

export const subscriptionPaymentReference = (planId: string, userName: string) => {
  const slug = (userName || 'USER').replace(/\s+/g, '').slice(0, 12).toUpperCase()
  return `NYUMBA-${planId.toUpperCase()}-${slug}`
}
