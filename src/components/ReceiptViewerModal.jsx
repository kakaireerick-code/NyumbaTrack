import React from 'react'
import { Modal } from './UI'
import { LoadingButton } from './UI'
import PaymentReceipt from './PaymentReceipt'
import { buildReceiptHtmlDocument, downloadReceiptDocument, openReceiptDocument } from '../utils/receipts'

export default function ReceiptViewerModal({
  open,
  onClose,
  receiptData,
  whatsappUrl,
}) {
  const [loading, setLoading] = React.useState(false)

  if (!open || !receiptData) return null

  const handlePrint = () => {
    const html = buildReceiptHtmlDocument(receiptData)
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 250)
  }

  const handleOpenDocument = () => {
    setLoading(true)
    const ok = openReceiptDocument(receiptData)
    setTimeout(() => setLoading(false), 400)
    if (!ok) downloadReceiptDocument(receiptData)
  }

  return (
    <Modal open={open} onClose={onClose} title="" wide>
      <div className="print-receipt py-2">
        <PaymentReceipt data={receiptData} />
      </div>

      <p className="text-xs text-center text-gray-400 mt-3 mb-4">
        This receipt opens in Word as a read-only document — not editable.
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        <LoadingButton
          loading={loading}
          className="px-4 py-2.5 bg-[#2d6a4f] text-white rounded-lg text-sm font-medium"
          onClick={handleOpenDocument}
        >
          Open in Word
        </LoadingButton>
        <button
          type="button"
          className="px-4 py-2.5 border rounded-lg text-sm"
          onClick={() => downloadReceiptDocument(receiptData)}
        >
          Save copy
        </button>
        <button
          type="button"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm"
          onClick={handlePrint}
        >
          Print / PDF
        </button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm text-center"
          >
            Send summary
          </a>
        )}
        <button type="button" className="px-4 py-2.5 border rounded-lg text-sm text-gray-500" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
