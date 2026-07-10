import React from 'react'
import { Modal } from './UI'
import { LoadingButton } from './UI'
import { downloadText } from '../utils/helpers'

export default function ReceiptModal({ open, onClose, receiptText, whatsappUrl, onPrint }) {
  const [loading, setLoading] = React.useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Payment Receipt" wide>
      <div className="print-receipt bg-white dark:bg-gray-900 p-4 rounded border font-mono text-sm whitespace-pre-wrap">
        {receiptText}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <LoadingButton
          loading={loading}
          className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded"
          onClick={() => {
            setLoading(true)
            downloadText('receipt.txt', receiptText)
            setTimeout(() => setLoading(false), 500)
          }}
        >
          Download Receipt
        </LoadingButton>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded text-center">
            Send to WhatsApp
          </a>
        )}
        <button type="button" className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded" onClick={onPrint}>
          Print Receipt
        </button>
        <button type="button" className="flex-1 sm:flex-none px-4 py-2 border rounded" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
