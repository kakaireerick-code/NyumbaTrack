import { formatDate } from './dates'
import { formatCurrency } from './rentLedger'
import { ADMIN_MOMO_DISPLAY } from './billing'
import { getPlanById } from '../data/subscriptionPlans'

export type SubscriptionInvoice = {
  id: string
  invoiceNo: string
  date: string
  customerName: string
  customerEmail: string
  planId: string
  planName: string
  billingCycle: string
  amount: number
  momoReference: string
  paidTo: string
  periodStart: string
  periodEnd: string
}

let invoiceCounter = 0

export const generateInvoiceNo = (existing: SubscriptionInvoice[] = []): string => {
  const year = new Date().getFullYear()
  const count = existing.filter((i) => i.invoiceNo.startsWith(`INV-${year}`)).length + 1
  return `INV-${year}-${String(count).padStart(4, '0')}`
}

export const buildSubscriptionInvoice = (opts: {
  customerName: string
  customerEmail: string
  planId: string
  billingCycle: string
  amount: number
  momoReference: string
  periodStart: string
  periodEnd: string
  existingInvoices?: SubscriptionInvoice[]
}): SubscriptionInvoice => {
  invoiceCounter += 1
  const plan = getPlanById(opts.planId)
  const invoiceNo = generateInvoiceNo(opts.existingInvoices)
  return {
    id: `inv-${Date.now()}`,
    invoiceNo,
    date: new Date().toISOString().split('T')[0],
    customerName: opts.customerName,
    customerEmail: opts.customerEmail,
    planId: opts.planId,
    planName: plan?.name || opts.planId,
    billingCycle: opts.billingCycle,
    amount: opts.amount,
    momoReference: opts.momoReference,
    paidTo: ADMIN_MOMO_DISPLAY,
    periodStart: opts.periodStart,
    periodEnd: opts.periodEnd,
  }
}

export const formatInvoiceText = (inv: SubscriptionInvoice): string => {
  return `=====================================
NYUMBATRACK — SUBSCRIPTION INVOICE
Official receipt for your plan payment
=====================================

Invoice No: ${inv.invoiceNo}
Date: ${formatDate(inv.date)}
Bill To: ${inv.customerName}
Email: ${inv.customerEmail}

-------------------------------------
PLAN DETAILS
-------------------------------------
Plan: ${inv.planName}
Billing: ${inv.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
Service period: ${formatDate(inv.periodStart)} to ${formatDate(inv.periodEnd)}

-------------------------------------
PAYMENT
-------------------------------------
Amount Paid: ${formatCurrency(inv.amount)}
Method: MTN Mobile Money (MoMo)
Paid to: ${inv.paidTo}
Transaction Ref: ${inv.momoReference}

-------------------------------------
Thank you for subscribing to NyumbaTrack!
Your subscription is now active.

Questions? Reply to this email or contact support.
=====================================`
}

export const downloadInvoice = (inv: SubscriptionInvoice): void => {
  const text = formatInvoiceText(inv)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${inv.invoiceNo}-nyumbatrack-invoice.txt`
  a.click()
  URL.revokeObjectURL(url)
}

/** Simulates sending invoice to customer's Google email (stored in app + shown in UI) */
export const queueInvoiceEmail = (
  inv: SubscriptionInvoice,
  inbox: Array<{ id: string; to: string; subject: string; body: string; sentAt: string }>,
): typeof inbox => {
  return [
    ...inbox,
    {
      id: inv.id,
      to: inv.customerEmail,
      subject: `NyumbaTrack Invoice ${inv.invoiceNo} — ${inv.planName} Plan`,
      body: formatInvoiceText(inv),
      sentAt: new Date().toISOString(),
    },
  ]
}
