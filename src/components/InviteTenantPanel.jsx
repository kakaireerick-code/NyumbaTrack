import React, { useState } from 'react'
import { Copy, Link2, RefreshCw, MessageCircle } from 'lucide-react'
import {
  getJoinUrl,
  getShareTemplate,
  regenerateInvite,
  findInviteForUnit,
  createInviteForUnit,
} from '../lib/invites'

export default function InviteTenantPanel({
  unit,
  building,
  ownerId,
  onCodeChange,
  showToast,
  compact = false,
}) {
  const [code, setCode] = useState(() => {
    const inv = findInviteForUnit(unit?.id)
    return inv?.code || unit?.inviteCode || ''
  })

  if (!unit || !ownerId) return null

  const ensureCode = () => {
    let inv = findInviteForUnit(unit.id)
    if (!inv || inv.status !== 'pending') {
      inv = createInviteForUnit(ownerId, String(unit.buildingId), String(unit.id))
      onCodeChange?.(inv.code)
    }
    setCode(inv.code)
    return inv.code
  }

  const activeCode = code || ensureCode()
  const link = getJoinUrl(activeCode)
  const template = getShareTemplate(activeCode)

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast?.(`${label} copied`, 'success')
    } catch {
      showToast?.('Copy failed — select and copy manually', 'error')
    }
  }

  const handleRegenerate = () => {
    const inv = regenerateInvite(ownerId, String(unit.buildingId), String(unit.id), activeCode)
    setCode(inv.code)
    onCodeChange?.(inv.code)
    showToast?.('New code generated — old link no longer works', 'success')
  }

  if (compact) {
    return (
      <div className="text-xs space-y-1 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="font-mono font-bold">{activeCode}</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => copy(link, 'Link')} className="underline text-[#2d6a4f]">Copy link</button>
          <button type="button" onClick={() => copy(activeCode, 'Code')} className="underline text-[#2d6a4f]">Copy code</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 border-l-4 border-[#2d6a4f] space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageCircle size={16} /> Invite tenant
      </h3>
      <p className="text-xs text-gray-500">
        Unit {unit.unitNumber} · {building?.name || 'Property'}
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-center text-lg tracking-widest">
        {activeCode}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(link, 'Tenant link')}
          className="flex items-center gap-1 px-3 py-2 text-xs bg-[#2d6a4f] text-white rounded"
        >
          <Link2 size={14} /> Copy tenant link
        </button>
        <button
          type="button"
          onClick={() => copy(activeCode, 'Code')}
          className="flex items-center gap-1 px-3 py-2 text-xs border rounded"
        >
          <Copy size={14} /> Copy code only
        </button>
        <button
          type="button"
          onClick={() => copy(template, 'Message')}
          className="flex items-center gap-1 px-3 py-2 text-xs border rounded"
        >
          <Copy size={14} /> Copy WhatsApp text
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          className="flex items-center gap-1 px-3 py-2 text-xs text-orange-700 border border-orange-300 rounded"
        >
          <RefreshCw size={14} /> Regenerate code
        </button>
      </div>
      <p className="text-[10px] text-gray-400 break-all">{link}</p>
    </div>
  )
}
