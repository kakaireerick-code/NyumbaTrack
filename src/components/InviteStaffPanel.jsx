import React, { useState, useEffect } from 'react'
import { Copy, Link2, RefreshCw, Wrench } from 'lucide-react'
import {
  getJoinUrl,
  getShareTemplate,
  regenerateCaretakerInvite,
  findPendingCaretakerInviteForOwner,
  createCaretakerInvite,
  pushInviteToCloud,
} from '../lib/invites'

export default function InviteStaffPanel({ ownerId, showToast, buildings = [] }) {
  const [propertyId, setPropertyId] = useState(() => buildings[0]?.id || '')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!propertyId && buildings[0]?.id) setPropertyId(buildings[0].id)
  }, [buildings, propertyId])

  useEffect(() => {
    if (!ownerId || !propertyId) return
    const inv = findPendingCaretakerInviteForOwner(ownerId, propertyId)
    setCode(inv?.code || '')
  }, [ownerId, propertyId])

  if (!ownerId) return null

  const selectedBuilding = buildings.find((b) => b.id === propertyId)

  const syncCloud = (inv) => {
    pushInviteToCloud(inv, {
      buildingName: selectedBuilding
        ? `${selectedBuilding.name} · ${selectedBuilding.address || ''}`.trim()
        : undefined,
    })
  }

  const ensureCode = () => {
    let inv = findPendingCaretakerInviteForOwner(ownerId, propertyId)
    if (!inv) {
      inv = createCaretakerInvite(ownerId, propertyId)
      syncCloud(inv)
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
    const inv = regenerateCaretakerInvite(ownerId, activeCode, propertyId)
    setCode(inv.code)
    syncCloud(inv)
    showToast?.('New code generated — old link no longer works', 'success')
  }

  return (
    <div className="card p-4 border-l-4 border-brand/40 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Wrench size={16} /> Invite caretaker
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Pick the property first, then share the link. Caretakers only see units and maintenance — not rent amounts.
      </p>

      {buildings.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-1">Property</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}{b.address ? ` — ${b.address}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-center text-lg tracking-widest">
        {activeCode}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(link, 'Link')}
          className="tap-target flex items-center gap-1 px-3 py-2 text-xs bg-brand text-white rounded-lg"
        >
          <Link2 size={14} /> Copy caretaker link
        </button>
        <button
          type="button"
          onClick={() => copy(activeCode, 'Code')}
          className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg"
        >
          <Copy size={14} /> Copy code only
        </button>
        <button
          type="button"
          onClick={() => copy(template, 'Message')}
          className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg"
        >
          <Copy size={14} /> Copy message
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          className="tap-target flex items-center gap-1 px-3 py-2 text-xs text-brand border border-brand/30 rounded-lg"
        >
          <RefreshCw size={14} /> Regenerate code
        </button>
      </div>
      <p className="text-[10px] text-gray-400 break-all">{link}</p>
    </div>
  )
}
