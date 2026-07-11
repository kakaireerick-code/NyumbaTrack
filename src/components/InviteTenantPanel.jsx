import React, { useState, useEffect } from 'react'
import { Copy, Link2, RefreshCw, MessageCircle } from 'lucide-react'
import {
  getJoinUrl,
  getShareTemplate,
  regenerateTenantInvite,
  getOrCreateTenantInvite,
  pushInviteToCloud,
} from '../lib/invites'

export default function InviteTenantPanel({
  unit,
  building,
  ownerId,
  onCodeChange,
  showToast,
  compact = false,
}) {
  const [code, setCode] = useState(() => unit?.inviteCode || '')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!unit?.id || !ownerId) return
    const inv = getOrCreateTenantInvite(
      ownerId,
      String(unit.buildingId),
      String(unit.id),
      unit.inviteCode,
    )
    setCode(inv.code)
    setReady(true)
    if (inv.code !== unit.inviteCode) {
      onCodeChange?.(inv.code)
    }
    pushInviteToCloud(inv, {
      unitNumber: unit?.unitNumber,
      buildingName: building?.name,
      monthlyRent: unit?.monthlyRent,
      depositAmount: unit?.depositAmount,
      rentDueDay: unit?.rentDueDay,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable per unit; avoid parent callback churn
  }, [unit?.id, ownerId])

  if (!unit || !ownerId) return null

  const syncToCloud = (inv) => {
    pushInviteToCloud(inv, {
      unitNumber: unit?.unitNumber,
      buildingName: building?.name,
      monthlyRent: unit?.monthlyRent,
      depositAmount: unit?.depositAmount,
      rentDueDay: unit?.rentDueDay,
    })
  }

  const activeCode = code
  const link = activeCode ? getJoinUrl('tenant', activeCode) : ''
  const template = activeCode ? getShareTemplate('tenant', activeCode) : ''

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast?.(`${label} copied`, 'success')
    } catch {
      showToast?.('Copy failed — select and copy manually', 'error')
    }
  }

  const handleRegenerate = () => {
    const inv = regenerateTenantInvite(ownerId, String(unit.buildingId), String(unit.id), activeCode)
    setCode(inv.code)
    onCodeChange?.(inv.code)
    syncToCloud(inv)
    showToast?.('New code generated — old link no longer works', 'success')
  }

  if (!ready && !activeCode) {
    return (
      <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
        Loading invite link…
      </div>
    )
  }

  if (compact) {
    return (
      <div className="text-xs space-y-1 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="font-mono font-bold">{activeCode}</p>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => copy(link, 'Link')} className="underline text-brand">Copy link</button>
          <button type="button" onClick={() => copy(activeCode, 'Code')} className="underline text-brand">Copy code</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 border-l-4 border-brand/40 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageCircle size={16} /> Invite tenant
      </h3>
      <p className="text-xs text-gray-500">
        Unit {unit.unitNumber} · {building?.name || 'Property'}
      </p>
      <p className="text-[10px] text-gray-400">
        This link stays valid until you tap Regenerate or a tenant successfully joins.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-center text-lg tracking-widest">
        {activeCode}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(link, 'Link')}
          className="tap-target flex items-center gap-1 px-3 py-2 text-xs bg-brand text-white rounded-lg"
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
          <Copy size={14} /> Copy message
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
