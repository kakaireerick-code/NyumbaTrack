import React from 'react'
import PaymentReceipt from '../components/PaymentReceipt'
import { getReceiptById } from '../lib/receiptStore'
import { buildReceiptHtmlDocument, downloadReceiptDocument } from '../utils/receipts'
import { canViewField, normalizeRole, canAccessPage } from '../lib/permissions'

export default function ReceiptPage({ receiptId, currentRole, authUser, onClose }) {
  const role = normalizeRole(currentRole || '')
  const snapshot = getReceiptById(receiptId)

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <h1 className="text-lg font-bold mb-2">Receipt not found</h1>
          <p className="text-sm text-gray-500 mb-4">This receipt may have been removed or the link is invalid.</p>
          {onClose && (
            <button type="button" className="px-4 py-2 bg-[#2d6a4f] text-white rounded" onClick={onClose}>
              Go back
            </button>
          )}
        </div>
      </div>
    )
  }

  if (normalizeRole(role) === 'tenant' && authUser?.tenantId && snapshot.tenantId !== authUser.tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <p className="text-sm text-gray-600">You do not have access to this receipt.</p>
        </div>
      </div>
    )
  }

  if (!canAccessPage(role, 'receipt-view') || !canViewField(role, 'receipt.amount')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="card p-8 text-center max-w-md">
          <p className="text-sm text-gray-600">You do not have access to this document.</p>
        </div>
      </div>
    )
  }

  const printReceipt = () => {
    const html = buildReceiptHtmlDocument(snapshot)
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 250)
  }

  return (
    <div className="min-h-screen bg-[#e8ebe9] py-8 px-4 receipt-print-page">
      <div className="max-w-lg mx-auto">
        <PaymentReceipt data={snapshot} />
        <p className="text-xs text-center text-gray-500 mt-4">
          Official payment record · Read only · Not editable
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-4 no-print">
          <button
            type="button"
            className="px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg text-sm"
            onClick={printReceipt}
          >
            Print / PDF
          </button>
          <button
            type="button"
            className="px-4 py-2.5 border rounded-lg text-sm"
            onClick={() => downloadReceiptDocument(snapshot)}
          >
            Save copy
          </button>
          {onClose && (
            <button type="button" className="px-4 py-2.5 border rounded-lg text-sm text-gray-500" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
