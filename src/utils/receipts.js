import { fmtUGX, fmtDate } from './helpers'

export const generateReceiptNo = (payments) => {
  const year = new Date().getFullYear()
  const count = payments.filter((p) => p.receiptNo?.startsWith(`RCT-${year}`)).length + 1
  return `RCT-${year}-${String(count).padStart(3, '0')}`
}

const TYPE_LABELS = {
  rent: 'Rent payment',
  deposit: 'Security deposit',
  late_fee: 'Late fee',
  utility: 'Utility charge',
}

export const buildReceiptData = (payment, tenant, unit, building, settings, balance = 0) => {
  const tenantName = [tenant?.firstName, tenant?.lastName].filter(Boolean).join(' ') || 'Tenant'
  const propertyName = settings?.companyName || building?.name || 'NyumbaTrack'
  const bal = Number(balance) || 0

  return {
    receiptNo: payment?.receiptNo || 'PENDING',
    issuedAt: payment?.date || new Date().toISOString().split('T')[0],
    companyName: propertyName,
    propertyName: building?.name || propertyName,
    propertyAddress: building?.address || settings?.companyAddress || '',
    tenantName,
    unitNumber: unit?.unitNumber || '—',
    period: payment?.period || '—',
    paymentType: payment?.type || 'rent',
    paymentTypeLabel: TYPE_LABELS[payment?.type] || 'Payment',
    amount: Number(payment?.amount) || 0,
    amountFormatted: fmtUGX(payment?.amount),
    method: payment?.method || '—',
    reference: payment?.reference || '—',
    balance: bal,
    balanceFormatted: fmtUGX(bal),
    isPaidInFull: bal <= 0,
    issuedBy: settings?.managerName || 'Property Manager',
    notes: payment?.notes || '',
    status: payment?.status === 'pending' ? 'Pending confirmation' : 'Confirmed',
  }
}

/** Plain text fallback for WhatsApp / clipboard */
export const buildReceiptText = (payment, tenant, unit, building, settings, balance) => {
  const d = buildReceiptData(payment, tenant, unit, building, settings, balance)
  return `OFFICIAL RENT RECEIPT
${d.companyName}
${d.propertyAddress}

Receipt No: ${d.receiptNo}
Date: ${fmtDate(d.issuedAt)}

Received from: ${d.tenantName}
Unit: ${d.unitNumber}
Period: ${d.period}

Amount: ${d.amountFormatted}
Method: ${d.method}
Reference: ${d.reference}

Balance remaining: ${d.balanceFormatted}
${d.isPaidInFull ? 'Status: FULLY PAID' : ''}

Issued by: ${d.issuedBy}`
}

export const buildWhatsAppReceipt = (payment, tenant, unit, balance) =>
  `Rent Receipt ${payment.receiptNo} | ${tenant?.firstName} ${tenant?.lastName} | Unit ${unit?.unitNumber} | ${fmtUGX(payment.amount)} | Balance: ${fmtUGX(balance)}`

const receiptDocumentStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #e8ebe9;
    padding: 24px;
    -webkit-user-select: none;
    user-select: none;
  }
  .receipt {
    max-width: 420px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #c5d4c9;
    box-shadow: 0 8px 32px rgba(26, 46, 26, 0.12);
  }
  .header {
    background: linear-gradient(135deg, #1a2e1a 0%, #2d6a4f 100%);
    color: #fff;
    padding: 20px 24px;
    text-align: center;
  }
  .header h1 { font-size: 11px; letter-spacing: 0.2em; font-weight: 600; opacity: 0.9; }
  .header .no { font-size: 22px; font-weight: 700; margin-top: 8px; font-family: ui-monospace, monospace; }
  .body { padding: 24px; }
  .amount-box {
    text-align: center;
    padding: 20px;
    margin: 16px 0;
    background: #f4faf6;
    border: 2px dashed #2d6a4f;
    border-radius: 4px;
  }
  .amount-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; }
  .amount-box .value { font-size: 28px; font-weight: 700; color: #1a2e1a; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; font-size: 13px; margin: 16px 0; }
  .grid .full { grid-column: 1 / -1; }
  .grid dt { color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
  .grid dd { color: #1a1a1a; font-weight: 500; }
  .balance {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; margin-top: 16px;
    background: #f8f9fa; border-radius: 4px; font-size: 14px;
  }
  .balance.paid { background: #e8f5e9; color: #1b5e20; }
  .balance.due { background: #fff3e0; color: #e65100; }
  .footer {
    padding: 16px 24px; border-top: 1px solid #e8ebe9;
    font-size: 11px; color: #888; text-align: center; line-height: 1.5;
  }
  .badge {
    display: inline-block; padding: 4px 10px; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    background: #e8f5e9; color: #2d6a4f; margin-top: 8px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border: none; max-width: 100%; }
  }
`

export const buildReceiptHtmlDocument = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${data.receiptNo}</title>
  <style>${receiptDocumentStyles}</style>
</head>
<body oncontextmenu="return false">
  <div class="receipt">
    <div class="header">
      <h1>PAYMENT RECEIPT</h1>
      <div class="no">${data.receiptNo}</div>
      <div class="badge">${data.status.toUpperCase()}</div>
    </div>
    <div class="body">
      <p style="font-size:15px;font-weight:600;color:#1a2e1a">${data.companyName}</p>
      <p style="font-size:12px;color:#666;margin-top:4px">${data.propertyAddress}</p>
      <div class="amount-box">
        <div class="label">${data.paymentTypeLabel}</div>
        <div class="value">${data.amountFormatted}</div>
      </div>
      <dl class="grid">
        <div><dt>Date</dt><dd>${fmtDate(data.issuedAt)}</dd></div>
        <div><dt>Period</dt><dd>${data.period}</dd></div>
        <div><dt>Received from</dt><dd>${data.tenantName}</dd></div>
        <div><dt>Unit</dt><dd>${data.unitNumber}</dd></div>
        <div><dt>Payment method</dt><dd>${data.method}</dd></div>
        <div><dt>Reference</dt><dd>${data.reference}</dd></div>
        ${data.notes ? `<div class="full"><dt>Notes</dt><dd>${data.notes}</dd></div>` : ''}
      </dl>
      <div class="balance ${data.isPaidInFull ? 'paid' : 'due'}">
        <span>Balance remaining</span>
        <strong>${data.isPaidInFull ? 'Fully paid ✓' : data.balanceFormatted}</strong>
      </div>
    </div>
    <div class="footer">
      Issued by ${data.issuedBy}<br />
      This is an official payment record — not editable.<br />
      Generated by NyumbaTrack
    </div>
  </div>
</body>
</html>`

export const openReceiptDocument = (data) => {
  const html = buildReceiptHtmlDocument(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    URL.revokeObjectURL(url)
    return false
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return true
}

export const downloadReceiptDocument = (data) => {
  const html = buildReceiptHtmlDocument(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receipt-${data.receiptNo}.html`
  a.click()
  URL.revokeObjectURL(url)
}
