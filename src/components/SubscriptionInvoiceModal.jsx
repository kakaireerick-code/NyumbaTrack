import React from 'react'
import { Modal, LoadingButton } from './UI'
import { formatInvoiceText, downloadInvoice } from '../lib/subscriptionInvoice'
import { formatCurrency } from '../lib/rentLedger'
import { formatDate } from '../lib/dates'

export default function SubscriptionInvoiceModal({ open, onClose, invoice, emailSent }) {
  if (!invoice) return null

  const handlePrint = () => window.print()

  return (
    <Modal open={open} onClose={onClose} title="Subscription confirmed" wide>
      <div className="print-receipt space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="font-semibold text-green-800 dark:text-green-200">Payment received — subscription active</p>
          {emailSent && (
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Invoice sent to <strong>{invoice.customerEmail}</strong> (your Google account email).
            </p>
          )}
        </div>

        <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded border max-h-64 overflow-y-auto">
          {formatInvoiceText(invoice)}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Invoice</span><p className="font-bold">{invoice.invoiceNo}</p></div>
          <div><span className="text-gray-500">Amount</span><p className="font-bold">{formatCurrency(invoice.amount)}</p></div>
          <div><span className="text-gray-500">Plan</span><p className="font-bold">{invoice.planName}</p></div>
          <div><span className="text-gray-500">Valid until</span><p className="font-bold">{formatDate(invoice.periodEnd)}</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <LoadingButton
            className="flex-1 py-2 bg-[#2d6a4f] text-white rounded"
            onClick={() => downloadInvoice(invoice)}
          >
            Download Invoice
          </LoadingButton>
          <button type="button" className="flex-1 py-2 border rounded" onClick={handlePrint}>
            Print
          </button>
          <button type="button" className="flex-1 py-2 border rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
