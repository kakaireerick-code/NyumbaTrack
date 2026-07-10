import React, { useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Modal, LoadingButton } from './UI'
import GuidancePanel from './GuidancePanel'
import { storePdfFile, tryExtractPdfHints } from '../lib/documentStorage'
import { splitName } from '../lib/tenantData'

const PDF_GUIDANCE = {
  variant: 'info',
  headline: 'Have a PDF agreement?',
  detail: "Attach it here. We'll pull details when possible; you can type what's missing.",
  nextSteps: ['Upload a PDF under 800KB', 'Review extracted rent and dates', 'Toggle share only when ready for tenant to see it'],
}

export default function AgreementUploadModal({
  open,
  onClose,
  tenant,
  unit,
  onSave,
  showToast,
}) {
  const [fields, setFields] = useState({
    tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}`.replace('Tenant Pending', '') : '',
    rentAmount: tenant?.rentAmount ? String(tenant.rentAmount) : unit?.monthlyRent ? String(unit.monthlyRent) : '',
    leaseStart: tenant?.leaseStart || '',
    leaseEnd: tenant?.leaseEnd || '',
    deposit: tenant?.depositAmount ? String(tenant.depositAmount) : '',
    noticePeriodDays: tenant?.noticePeriodDays ? String(tenant.noticePeriodDays) : '',
    shareAgreementWithTenant: !!tenant?.shareAgreementWithTenant,
  })
  const [doc, setDoc] = useState(tenant?.agreementPdf || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const stored = await storePdfFile(file)
      setDoc(stored)
      const hints = tryExtractPdfHints(stored.dataUrl)
      setFields((f) => ({
        ...f,
        rentAmount: hints.rent ? String(hints.rent) : f.rentAmount,
        leaseStart: hints.leaseStart || f.leaseStart,
        leaseEnd: hints.leaseEnd || f.leaseEnd,
      }))
      showToast?.('Agreement attached', 'success')
    } catch (err) {
      setError(err.message || 'Upload failed')
    }
    setLoading(false)
  }

  const handleSave = () => {
    const { firstName, lastName } = splitName(fields.tenantName || 'Tenant Pending')
    onSave?.({
      agreementPdf: doc,
      shareAgreementWithTenant: fields.shareAgreementWithTenant,
      firstName,
      lastName,
      rentAmount: parseInt(fields.rentAmount, 10) || tenant?.rentAmount || unit?.monthlyRent,
      leaseStart: fields.leaseStart || tenant?.leaseStart,
      leaseEnd: fields.leaseEnd || tenant?.leaseEnd,
      depositAmount: parseInt(fields.deposit, 10) || tenant?.depositAmount,
      noticePeriodDays: fields.noticePeriodDays ? parseInt(fields.noticePeriodDays, 10) : null,
      dataSource: doc ? 'pdf' : tenant?.dataSource,
    })
    showToast?.('Agreement saved', 'success')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Attach tenancy agreement" wide>
      <GuidancePanel guidance={PDF_GUIDANCE} />
      {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 mb-4">
        <Upload className="text-[#2d6a4f] mb-2" size={28} />
        <span className="text-sm font-medium">Upload PDF agreement</span>
        <span className="text-xs text-gray-400 mt-1">Max ~800KB — smaller scans work best</span>
        <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
      </label>

      {doc && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded mb-4 text-sm">
          <FileText size={18} className="text-[#2d6a4f]" />
          <span className="flex-1 truncate">{doc.fileName}</span>
          <a href={doc.dataUrl} target="_blank" rel="noreferrer" className="text-[#2d6a4f] underline text-xs">
            Open
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1">Tenant name</label>
          <input className="w-full border rounded px-2 py-1.5" value={fields.tenantName} onChange={(e) => setFields({ ...fields, tenantName: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Monthly rent</label>
          <input type="number" className="w-full border rounded px-2 py-1.5" value={fields.rentAmount} onChange={(e) => setFields({ ...fields, rentAmount: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Lease start</label>
          <input type="date" className="w-full border rounded px-2 py-1.5" value={fields.leaseStart} onChange={(e) => setFields({ ...fields, leaseStart: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Lease end</label>
          <input type="date" className="w-full border rounded px-2 py-1.5" value={fields.leaseEnd} onChange={(e) => setFields({ ...fields, leaseEnd: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Deposit</label>
          <input type="number" className="w-full border rounded px-2 py-1.5" value={fields.deposit} onChange={(e) => setFields({ ...fields, deposit: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Notice period (days)</label>
          <input type="number" className="w-full border rounded px-2 py-1.5" value={fields.noticePeriodDays} onChange={(e) => setFields({ ...fields, noticePeriodDays: e.target.value })} />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm">
        <input
          type="checkbox"
          checked={fields.shareAgreementWithTenant}
          onChange={(e) => setFields({ ...fields, shareAgreementWithTenant: e.target.checked })}
        />
        Share agreement PDF with tenant (they see summary only until this is on)
      </label>

      <div className="flex gap-2 justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm">Cancel</button>
        <LoadingButton loading={loading} onClick={handleSave} className="px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm">
          Save agreement
        </LoadingButton>
      </div>
    </Modal>
  )
}
