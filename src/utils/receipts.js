import { fmtUGX, fmtDate } from './helpers'

export const generateReceiptNo = (payments) => {
  const year = new Date().getFullYear()
  const count = payments.filter((p) => p.receiptNo?.startsWith(`RCT-${year}`)).length + 1
  return `RCT-${year}-${String(count).padStart(3, '0')}`
}

export const buildReceiptText = (payment, tenant, unit, building, settings, balance) => {
  const logo = settings.logoDataUrl ? '[Logo attached]' : 'Logo not configured — add in Settings'
  return `=====================================
OFFICIAL RENT RECEIPT
${settings.companyName || building?.name || 'RentTrack Uganda'}
${building?.address || ''}
=====================================
${logo}

Receipt No: ${payment.receiptNo || 'N/A'}
Date: ${fmtDate(payment.date)}

Received from: ${tenant?.firstName || ''} ${tenant?.lastName || ''}
Unit: ${unit?.unitNumber || ''}
Period: ${payment.period || ''}

Amount Received: ${fmtUGX(payment.amount)}
Payment Method: ${payment.method || ''}
Reference: ${payment.reference || ''}

Running Balance: ${fmtUGX(balance)}
${balance <= 0 ? '(FULLY PAID)' : ''}

Issued by: ${settings.managerName || 'Property Manager'}
${settings.stampText || ''}
=====================================`
}

export const buildWhatsAppReceipt = (payment, tenant, unit, balance) =>
  `Rent Receipt: ${payment.receiptNo} | ${tenant?.firstName} ${tenant?.lastName} | Unit ${unit?.unitNumber} | ${fmtUGX(payment.amount)} | Balance: ${fmtUGX(balance)}`
