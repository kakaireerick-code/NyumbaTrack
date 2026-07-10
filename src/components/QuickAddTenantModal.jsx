import React, { useState } from 'react'
import { Modal, LoadingButton } from './UI'
import GuidancePanel from './GuidancePanel'
import { buildQuickTenant, assignTenantToUnit } from '../lib/tenantData'
import { generateInviteCode } from '../lib/auth'
import { isoToday } from '../lib/dates'

const QUICK_GUIDANCE = {
  variant: 'info',
  headline: 'No written agreement yet?',
  detail: "Don't have a tenancy agreement? You can still add the tenant and upload documents later.",
  nextSteps: ['Enter name and phone if you have them', 'Save and share the invite code with your tenant'],
}

export default function QuickAddTenantModal({
  open,
  onClose,
  unit,
  buildingName,
  onSave,
  showToast,
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    monthlyRent: unit?.monthlyRent ? String(unit.monthlyRent) : '',
    moveInDate: isoToday(),
  })
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)

  if (!open || !unit) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const rent = parseInt(form.monthlyRent, 10) || Number(unit.monthlyRent) || 0
      const tenant = buildQuickTenant(unit, {
        name: form.name,
        phone: form.phone,
        monthlyRent: rent,
        moveInDate: form.moveInDate || undefined,
      })
      const code = generateInviteCode()
      const updatedUnit = assignTenantToUnit({ ...unit, inviteCode: code }, String(tenant.id), code)
      onSave?.({ tenant, unit: updatedUnit, inviteCode: code })
      setInviteCode(code)
      showToast?.('Tenant saved. Share the invite code when ready.', 'success')
      setLoading(false)
    }, 200)
  }

  const finish = () => {
    setInviteCode(null)
    setForm({ name: '', phone: '', monthlyRent: unit?.monthlyRent ? String(unit.monthlyRent) : '', moveInDate: isoToday() })
    onClose()
  }

  return (
    <Modal open={open} onClose={finish} title={`Quick add tenant — ${unit.unitNumber}`} wide>
      <GuidancePanel guidance={QUICK_GUIDANCE} />
      <p className="text-sm text-gray-500 mb-4">{buildingName}</p>

      {inviteCode ? (
        <div className="text-center space-y-4 py-4">
          <p className="text-green-700 font-medium">Tenant saved!</p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Invite code for your tenant</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{inviteCode}</p>
          </div>
          <p className="text-sm text-gray-500">Share by SMS or WhatsApp. They register free under Tenant → Register.</p>
          <button type="button" onClick={finish} className="px-4 py-2 bg-[#2d6a4f] text-white rounded">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tenant name</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Optional — shows as pending until you add a name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Optional"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly rent (UGX) *</label>
              <input
                type="number"
                min="0"
                required
                className="w-full border rounded px-3 py-2"
                value={form.monthlyRent}
                onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Move-in date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.moveInDate}
                onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={finish} className="px-4 py-2 border rounded text-sm">
              Cancel
            </button>
            <LoadingButton loading={loading} className="px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm">
              Save and invite
            </LoadingButton>
          </div>
        </form>
      )}
    </Modal>
  )
}
