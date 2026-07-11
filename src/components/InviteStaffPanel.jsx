import React, { useState } from 'react'
import { Copy, Link2, RefreshCw, Wrench } from 'lucide-react'
import {
  getJoinUrl,
  getShareTemplate,
  regenerateCaretakerInvite,
  findPendingCaretakerInviteForOwner,
  createCaretakerInvite,
  pushInviteToCloud,
} from '../lib/invites'

export default function InviteStaffPanel({ ownerId, showToast, propertyId }) {
  const [code, setCode] = useState(() => {
    const inv = findPendingCaretakerInviteForOwner(ownerId)
    return inv?.code || ''
  })

  if (!ownerId) return null

  const ensureCode = () => {
    let inv = findPendingCaretakerInviteForOwner(ownerId)
    if (!inv) {
      inv = createCaretakerInvite(ownerId, propertyId)
      pushInviteToCloud(inv)
    }
    setCode(inv.code)
    return inv.code
  }

  const activeCode = code || ensureCode()
  const link = getJoinUrl('caretaker', activeCode)
  const template = getShareTemplate('caretaker', activeCode)

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast?.(`${label} copied`, 'success')
    } catch {
      showToast?.('Copy failed — select and copy manually', 'error')
    }
  }

  const handleRegenerate = () => {
    const inv = regenerateCaretakerInvite(ownerId, activeCode)
    setCode(inv.code)
    pushInviteToCloud(inv)
    showToast?.('New code generated — old link no longer works', 'success')
  }

  return (
    <div className="card p-4 border-l-4 border-orange-500 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Wrench size={16} /> Invite caretaker
      </h3>
      <p className="text-xs text-gray-500">
        Share this link with your caretaker. They will only see units and maintenance — not rent amounts.
      </p>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-center text-lg tracking-widest">
        {activeCode}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(link, 'Link')}
          className="flex items-center gap-1 px-3 py-2 text-xs bg-orange-600 text-white rounded"
        >
          <Link2 size={14} /> Copy caretaker link
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
