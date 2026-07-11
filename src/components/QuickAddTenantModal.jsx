import React, { useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { Modal, LoadingButton } from './UI'
import GuidancePanel from './GuidancePanel'
import { buildQuickTenant, assignTenantToUnit } from '../lib/tenantData'
import {
  getOrCreateTenantInvite,
  getJoinUrl,
  getShareTemplate,
  pushInviteToCloud,
} from '../lib/invites'
import { isoToday } from '../lib/dates'

const QUICK_GUIDANCE = {
  variant: 'info',
  headline: 'No written agreement yet?',
  detail: "Don't have a tenancy agreement? You can still add the tenant and upload documents later.",
  nextSteps: ['Enter name and phone if you have them', 'Save and copy — the tenant join link copies automatically'],
}

export default function QuickAddTenantModal({
  open,
  onClose,
  unit,
  buildingName,
  building,
  ownerId,
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
  const [inviteLink, setInviteLink] = useState('')
  const [inviteTemplate, setInviteTemplate] = useState('')

  if (!open || !unit) return null

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast?.(`${label} copied`, 'success')
    } catch {
      showToast?.('Copy failed — select and copy manually', 'error')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ownerId) {
      showToast?.('Sign in as property owner first', 'error')
      return
    }
    setLoading(true)
    setTimeout(async () => {
      const rent = parseInt(form.monthlyRent, 10) || Number(unit.monthlyRent) || 0
      const tenant = buildQuickTenant(unit, {
        name: form.name,
        phone: form.phone,
        monthlyRent: rent,
        moveInDate: form.moveInDate || undefined,
      })
      const inv = getOrCreateTenantInvite(
        ownerId,
        String(unit.buildingId),
        String(unit.id),
        unit.inviteCode,
      )
      const code = inv.code
      const link = getJoinUrl('tenant', code)
      const template = getShareTemplate('tenant', code)
      const updatedUnit = assignTenantToUnit({ ...unit, inviteCode: code }, String(tenant.id), code)

      pushInviteToCloud(inv, {
        unitNumber: unit?.unitNumber,
        buildingName: building?.name || buildingName,
        monthlyRent: rent,
        depositAmount: unit?.depositAmount,
        rentDueDay: unit?.rentDueDay,
      })

      onSave?.({ tenant, unit: updatedUnit, inviteCode: code })
      setInviteCode(code)
      setInviteLink(link)
      setInviteTemplate(template)

      try {
        await navigator.clipboard.writeText(link)
        showToast?.('Tenant saved — join link copied to clipboard', 'success')
      } catch {
        showToast?.('Tenant saved. Copy the link below to share.', 'success')
      }
      setLoading(false)
    }, 200)
  }

  const finish = () => {
    setInviteCode(null)
    setInviteLink('')
    setInviteTemplate('')
    setForm({
      name: '',
      phone: '',
      monthlyRent: unit?.monthlyRent ? String(unit.monthlyRent) : '',
      moveInDate: isoToday(),
    })
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
          <p className="text-sm text-gray-500">Share by SMS or WhatsApp. They register free via your link.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => copyText(inviteLink, 'Link')}
              className="tap-target flex items-center gap-1 px-3 py-2 text-xs bg-brand text-white rounded-lg"
            >
              <Link2 size={14} /> Copy link
            </button>
            <button
              type="button"
              onClick={() => copyText(inviteCode, 'Code')}
              className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg"
            >
              <Copy size={14} /> Copy code
            </button>
            <button
              type="button"
              onClick={() => copyText(inviteTemplate, 'Message')}
              className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg"
            >
              <Copy size={14} /> Copy message
            </button>
          </div>
          <p className="text-[10px] text-gray-400 break-all px-2">{inviteLink}</p>
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
            <LoadingButton
              type="submit"
              loading={loading}
              className="px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm"
            >
              Save and copy
            </LoadingButton>
          </div>
        </form>
      )}
    </Modal>
  )
}
