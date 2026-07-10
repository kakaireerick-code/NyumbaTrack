import React, { useMemo, useState, useEffect } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import {
  getOwnerInbox,
  getThread,
  postMessage,
  markThreadReadByOwner,
  countUnreadForOwner,
} from '../lib/messages'
import { displayTenantName } from '../lib/tenantData'
import { Badge } from '../components/UI'

export default function MessagesPage({
  currentRole,
  ownerId,
  tenants,
  units,
  buildings,
  currentUser,
  showToast,
  unreadRefresh,
  setUnreadRefresh,
}) {
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [, setTick] = useState(0)

  const guidance = getPageGuidance(currentRole, 'messages', {})

  const threads = useMemo(() => {
    const inbox = getOwnerInbox(ownerId)
    const map = new Map()
    for (const msg of inbox) {
      const key = `${msg.unitId}-${msg.tenantId}`
      if (!map.has(key)) {
        const tenant = tenants.find((t) => t.id === msg.tenantId)
        const unit = units.find((u) => u.id === msg.unitId)
        const building = buildings.find((b) => b.id === msg.buildingId)
        const unread = inbox.filter(
          (m) => m.unitId === msg.unitId && m.tenantId === msg.tenantId && m.fromRole === 'tenant' && !m.readByOwner,
        ).length
        map.set(key, { tenant, unit, building, unitId: msg.unitId, tenantId: msg.tenantId, unread, last: msg })
      }
    }
    return [...map.values()].sort(
      (a, b) => new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime(),
    )
  }, [ownerId, tenants, units, buildings, unreadRefresh])

  const activeThread = selected
    ? getThread(selected.unitId, selected.tenantId)
    : []

  useEffect(() => {
    if (selected) {
      markThreadReadByOwner(ownerId, selected.unitId, selected.tenantId)
      setUnreadRefresh?.((n) => n + 1)
    }
  }, [selected, ownerId, setUnreadRefresh])

  const sendReply = () => {
    if (!reply.trim() || !selected) return
    postMessage({
      ownerId,
      unitId: selected.unitId,
      tenantId: selected.tenantId,
      buildingId: selected.building?.id || selected.tenant?.buildingId,
      fromRole: 'owner',
      authorName: currentUser?.name || 'Landlord',
      body: reply.trim(),
    })
    setReply('')
    setTick((t) => t + 1)
    setUnreadRefresh?.((n) => n + 1)
    showToast?.('Reply sent', 'success')
  }

  const unreadTotal = countUnreadForOwner(ownerId)

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <MessageCircle className="text-[#2d6a4f]" size={28} />
        <div>
          <h1 className="text-xl font-bold">Messages</h1>
          <p className="text-sm text-gray-500">Tenant messages by unit</p>
        </div>
        {unreadTotal > 0 && <Badge color="red">{unreadTotal} unread</Badge>}
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="grid md:grid-cols-3 gap-4 min-h-[400px]">
        <div className="card p-2 space-y-1 max-h-[60vh] overflow-y-auto">
          {threads.length === 0 ? (
            <p className="text-sm text-gray-500 p-3">No tenant messages yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={`${t.unitId}-${t.tenantId}`}
                type="button"
                onClick={() => setSelected(t)}
                className={`w-full text-left p-3 rounded text-sm ${
                  selected?.tenantId === t.tenantId && selected?.unitId === t.unitId
                    ? 'bg-[#2d6a4f]/10 border border-[#2d6a4f]/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <p className="font-medium">{displayTenantName(t.tenant)}</p>
                <p className="text-xs text-gray-500">
                  {t.unit?.unitNumber} · {t.building?.name}
                </p>
                {t.unread > 0 && <Badge color="red">{t.unread} new</Badge>}
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2 card p-4 flex flex-col min-h-[300px]">
          {!selected ? (
            <p className="text-gray-500 text-sm m-auto">Select a conversation</p>
          ) : (
            <>
              <p className="font-semibold text-sm mb-3 border-b pb-2">
                {displayTenantName(selected.tenant)} — Unit {selected.unit?.unitNumber}
              </p>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[40vh]">
                {activeThread.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded text-sm max-w-[85%] ${
                      m.fromRole === 'owner'
                        ? 'ml-auto bg-[#2d6a4f] text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-xs opacity-70 mb-0.5">{m.authorName}</p>
                    <p>{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  placeholder="Reply to tenant…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                />
                <button type="button" onClick={sendReply} className="px-3 py-2 bg-[#2d6a4f] text-white rounded">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
