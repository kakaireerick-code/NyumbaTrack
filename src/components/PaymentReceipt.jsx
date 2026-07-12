import React from 'react'
import { CheckCircle2, Receipt } from 'lucide-react'
import { fmtDate } from '../utils/helpers'

/**
 * Read-only styled payment receipt — not an editable document.
 * Used in modals, print view, and standalone HTML export.
 */
export default function PaymentReceipt({ data, className = '' }) {
  if (!data) return null

  const paid = data.isPaidInFull

  return (
    <div
      className={`payment-receipt-document select-none ${className}`}
      aria-label={`Payment receipt ${data.receiptNo}`}
      contentEditable={false}
      suppressContentEditableWarning
    >
      <div className="receipt-paper mx-auto max-w-md overflow-hidden rounded-lg border border-[#c5d4c9] bg-white shadow-lg dark:bg-gray-900 dark:border-gray-700">
        {/* Header band */}
        <div
          className="px-6 py-5 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d6a4f 100%)' }}
        >
          <div className="flex items-center justify-center gap-2 opacity-90">
            <Receipt size={16} />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">Payment receipt</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-wide">{String(data.receiptNo)}</p>
          <span
            className={`inline-block mt-2 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${
              data.status === 'Pending confirmation'
                ? 'bg-yellow-400/90 text-yellow-900'
                : 'bg-white/20 text-white'
            }`}
          >
            {String(data.status)}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-base font-semibold text-[#1a2e1a] dark:text-gray-100">{String(data.companyName)}</p>
          {data.propertyAddress && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{String(data.propertyAddress)}</p>
          )}

          {/* Amount highlight */}
          <div className="my-5 py-5 px-4 text-center rounded border-2 border-dashed border-[#2d6a4f]/50 bg-[#f4faf6] dark:bg-green-900/20">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {String(data.paymentTypeLabel)}
            </p>
            <p className="text-3xl font-bold text-[#1a2e1a] dark:text-green-100 mt-1 tabular-nums">
              {String(data.amountFormatted)}
            </p>
          </div>

          {/* Details grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <ReceiptField label="Date" value={fmtDate(data.issuedAt)} />
            <ReceiptField label="Period" value={data.period} />
            <ReceiptField label="Received from" value={data.tenantName} />
            <ReceiptField label="Unit" value={data.unitNumber} />
            <ReceiptField label="Property" value={data.propertyName} className="col-span-2" />
            <ReceiptField label="Payment method" value={data.method} />
            <ReceiptField label="Reference" value={data.reference} mono />
            {data.notes ? (
              <ReceiptField label="Notes" value={data.notes} className="col-span-2" />
            ) : null}
          </dl>

          {/* Balance strip */}
          <div
            className={`mt-5 flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
              paid
                ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : 'bg-orange-50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
            }`}
          >
            <span className="font-medium">Balance remaining</span>
            <span className="font-bold flex items-center gap-1 tabular-nums">
              {paid ? (
                <>
                  <CheckCircle2 size={16} />
                  Fully paid
                </>
              ) : (
                String(data.balanceFormatted)
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Issued by <span className="font-medium text-gray-700 dark:text-gray-300">{String(data.issuedBy)}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
            Official payment record · View only · Nyumba-track
          </p>
        </div>
      </div>
    </div>
  )
}

function ReceiptField({ label, value, mono, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</dt>
      <dd className={`font-medium text-gray-900 dark:text-gray-100 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {String(value || '—')}
      </dd>
    </div>
  )
}
