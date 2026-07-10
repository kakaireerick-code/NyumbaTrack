import React, { useMemo, useState } from 'react'
import {
  fmtUGX,
  fmtDate,
  getTenantBalance,
  getRowColor,
  daysUntilLeaseEnd,
  downloadText,
  daysOpen,
} from '../utils/helpers'
import { REMINDER_TEMPLATES, getReminderType } from '../utils/reminders'
import { Modal, Badge, EmptyState, LoadingButton } from '../components/UI'

const inputCls = 'w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600'
const btnPrimary = 'px-4 py-2 bg-[#2d6a4f] text-white rounded hover:opacity-90'
const btnSecondary = 'px-4 py-2 border rounded dark:border-gray-600'

function lookupUnit(units, id) {
  return units.find((u) => u.id === id)
}

function lookupBuilding(buildings, id) {
  return buildings.find((b) => b.id === id)
}

export function TenantsPage({ tenants, payments, units, buildings, setSelectedTenant }) {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return tenants.filter((t) => {
      const unit = lookupUnit(units, t.unitId)
      const hay = `${t.firstName} ${t.lastName} ${t.phone} ${t.nin} ${unit?.unitNumber || ''}`.toLowerCase()
      return !q || hay.includes(q)
    })
  }, [tenants, units, search])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Tenants</h1>
      <input
        className={`${inputCls} max-w-md`}
        placeholder="Search by name, phone, unit, NIN…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState message="No tenants recorded. Add a tenant to an occupied unit." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Building</th>
                <th className="p-2">Rent</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Lease Ends</th>
                <th className="p-2">Status</th>
                <th className="p-2">Language</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const unit = lookupUnit(units, t.unitId)
                const building = lookupBuilding(buildings, t.buildingId)
                const bal = getTenantBalance(t.id, tenants, payments)
                const statusColor = t.status === 'Active' ? 'green' : t.status === 'Late' ? 'orange' : t.status === 'Defaulter' ? 'red' : 'gray'
                return (
                  <tr
                    key={`tenant-row-${t.id}`}
                    className={`border-b dark:border-gray-700 cursor-pointer hover:opacity-90 ${getRowColor(bal.daysLate)}`}
                    onClick={() => setSelectedTenant(t)}
                  >
                    <td className="p-2 font-medium">{t.firstName} {t.lastName}</td>
                    <td className="p-2">{unit?.unitNumber}</td>
                    <td className="p-2">{building?.name}</td>
                    <td className="p-2">{fmtUGX(t.rentAmount)}</td>
                    <td className="p-2">{fmtUGX(bal.balance)}</td>
                    <td className="p-2">{fmtDate(t.leaseEnd)}</td>
                    <td className="p-2"><Badge color={statusColor}>{t.status}</Badge></td>
                    <td className="p-2">{t.preferredLanguage === 'Luganda' ? 'LG' : 'EN'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function LeaseManagerPage({ tenants, setTenants, units, buildings, settings, showToast }) {
  const [filter, setFilter] = useState('all')
  const [renewTenant, setRenewTenant] = useState(null)
  const [renewForm, setRenewForm] = useState({ leaseEnd: '', rentAmount: '', effectiveDate: '' })

  const expiringSoon = useMemo(() =>
    tenants.filter((t) => {
      const days = daysUntilLeaseEnd(t.leaseEnd)
      return days <= 60 && days >= 0 && t.status !== 'Departed'
    }),
  [tenants])

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (t.status === 'Departed') return false
      const days = daysUntilLeaseEnd(t.leaseEnd)
      if (filter === '30') return days <= 30 && days >= 0
      if (filter === '60') return days <= 60 && days >= 0
      if (filter === 'expired') return days < 0
      if (filter === 'active') return days >= 0
      return true
    })
  }, [tenants, filter])

  const openRenew = (tenant) => {
    setRenewTenant(tenant)
    setRenewForm({
      leaseEnd: tenant.leaseEnd,
      rentAmount: tenant.rentAmount,
      effectiveDate: new Date().toISOString().split('T')[0],
    })
  }

  const rentIncreased = renewTenant && Number(renewForm.rentAmount) !== renewTenant.rentAmount
  const daysToEffective = renewForm.effectiveDate
    ? Math.ceil((new Date(renewForm.effectiveDate) - new Date()) / 86400000)
    : 0
  const rentWarning = rentIncreased && daysToEffective < 60

  const confirmRenewal = () => {
    if (!renewTenant) return
    setTenants((prev) =>
      prev.map((t) =>
        t.id === renewTenant.id
          ? { ...t, leaseEnd: renewForm.leaseEnd, rentAmount: Number(renewForm.rentAmount) }
          : t,
      ),
    )
    showToast('Lease renewed successfully', 'success')
    setRenewTenant(null)
  }

  const generateRenewalLetter = () => {
    if (!renewTenant) return
    const unit = lookupUnit(units, renewTenant.unitId)
    const building = lookupBuilding(buildings, renewTenant.buildingId)
    const increaseBlock = rentIncreased
      ? `\nPlease note your rent has been adjusted from ${fmtUGX(renewTenant.rentAmount)} to ${fmtUGX(renewForm.rentAmount)} effective ${fmtDate(renewForm.effectiveDate)}, in accordance with 2 months advance notice as required by the Landlord and Tenant Act 2019.\n`
      : ''
    const text = `LEASE RENEWAL NOTICE
Date: ${fmtDate(new Date())}

To: ${renewTenant.firstName} ${renewTenant.lastName}, Unit ${unit?.unitNumber}, ${building?.name}

Dear ${renewTenant.firstName},

This letter confirms the renewal of your tenancy agreement:
New lease period: ${fmtDate(renewTenant.leaseStart)} to ${fmtDate(renewForm.leaseEnd)}
Monthly rent: ${fmtUGX(renewForm.rentAmount)}
Due date: ${renewTenant.rentDueDay || settings.rentDueDay} of each month
${increaseBlock}
Please sign and return a copy of this notice.

Signed: ${settings.managerName || '_____________'} Date: ${fmtDate(new Date())}
Tenant signature: _________ Date: _______`
    downloadText(`renewal-${renewTenant.id}.txt`, text)
    showToast('Renewal letter downloaded', 'success')
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Lease Manager</h1>

      {expiringSoon.length > 0 && (
        <div className="card p-4 border-l-4 border-orange-500">
          <h2 className="font-semibold mb-2">Expiring Soon (within 60 days)</h2>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map((t) => {
              const days = daysUntilLeaseEnd(t.leaseEnd)
              const unit = lookupUnit(units, t.unitId)
              return (
                <span key={`exp-${t.id}`} className="inline-flex items-center gap-1">
                  <Badge color={days <= 30 ? 'red' : 'orange'}>
                    {t.firstName} {t.lastName} — {unit?.unitNumber} — {days}d left
                  </Badge>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <select className={`${inputCls} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Leases</option>
        <option value="30">Expiring in 30 days</option>
        <option value="60">Expiring in 60 days</option>
        <option value="expired">Expired</option>
        <option value="active">Active</option>
      </select>

      <div className="card table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="p-2">Tenant</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Lease Start</th>
              <th className="p-2">Lease End</th>
              <th className="p-2">Days Remaining</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const unit = lookupUnit(units, t.unitId)
              const days = daysUntilLeaseEnd(t.leaseEnd)
              const highlight = days <= 60 && days >= 0 ? 'bg-orange-50 dark:bg-orange-900/20' : days < 0 ? 'bg-red-50 dark:bg-red-900/20' : ''
              return (
                <tr key={`lease-${t.id}`} className={`border-b dark:border-gray-700 ${highlight}`}>
                  <td className="p-2">{t.firstName} {t.lastName}</td>
                  <td className="p-2">{unit?.unitNumber}</td>
                  <td className="p-2">{fmtDate(t.leaseStart)}</td>
                  <td className="p-2">{fmtDate(t.leaseEnd)}</td>
                  <td className="p-2">{days < 0 ? 'Expired' : days}</td>
                  <td className="p-2"><Badge color={days < 0 ? 'red' : days <= 60 ? 'orange' : 'green'}>{days < 0 ? 'Expired' : 'Active'}</Badge></td>
                  <td className="p-2">
                    <button type="button" className="text-sm text-[#2d6a4f]" onClick={() => openRenew(t)}>Renew Lease</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!renewTenant} onClose={() => setRenewTenant(null)} title="Renew Lease" wide>
        {renewTenant && (
          <div className="space-y-4">
            <p className="font-medium">{renewTenant.firstName} {renewTenant.lastName}</p>
            <div>
              <label className="block text-sm mb-1">New Lease End Date</label>
              <input type="date" className={inputCls} value={renewForm.leaseEnd} onChange={(e) => setRenewForm((f) => ({ ...f, leaseEnd: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm mb-1">New Monthly Rent (UGX)</label>
              <input type="number" className={inputCls} value={renewForm.rentAmount} onChange={(e) => setRenewForm((f) => ({ ...f, rentAmount: e.target.value }))} />
            </div>
            {rentIncreased && (
              <>
                <p className="text-sm">Rent increase from {fmtUGX(renewTenant.rentAmount)} to {fmtUGX(Number(renewForm.rentAmount))}</p>
                <div>
                  <label className="block text-sm mb-1">Effective Date</label>
                  <input type="date" className={inputCls} value={renewForm.effectiveDate} onChange={(e) => setRenewForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
                </div>
                {rentWarning && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded text-sm">
                    The Landlord and Tenant Act 2019 requires 2 months advance notice for rent increases. Either set the new rent to start 60+ days from today or keep the current rent for this renewal.
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 flex-wrap">
              <button type="button" className={btnPrimary} onClick={confirmRenewal}>Confirm Renewal</button>
              <button type="button" className={btnSecondary} onClick={generateRenewalLetter}>Generate Renewal Letter</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function RemindersPage({
  tenants,
  payments,
  units,
  buildings,
  settings,
  showToast,
  setNotifications,
  broadcastHistory,
  setBroadcastHistory,
  setGuarantorLogs,
}) {
  const [preview, setPreview] = useState(null)
  const [broadcast, setBroadcast] = useState({ buildingId: '', message: '', language: 'English' })

  const reminderRows = useMemo(() => {
    const rows = []
    const today = new Date()
    tenants.filter((t) => t.status !== 'Departed').forEach((t) => {
      const bal = getTenantBalance(t.id, tenants, payments)
      const dueDay = t.rentDueDay || settings.rentDueDay || 1
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay)
      if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1)
      const daysUntil = Math.ceil((dueDate - today) / 86400000)
      const daysLate = bal.daysLate
      const unit = lookupUnit(units, t.unitId)
      const building = lookupBuilding(buildings, t.buildingId)
      const lang = t.preferredLanguage === 'Luganda' ? 'lg' : 'en'
      const info = getReminderType(daysLate, daysUntil === 3 ? 3 : daysUntil === 0 ? 0 : null)
        || (daysLate === 3 ? getReminderType(3, null) : null)
        || (daysLate === 7 ? getReminderType(7, null) : null)
        || (daysLate >= 14 ? getReminderType(14, null) : null)

      if (!info && daysLate <= 0 && daysUntil > 3) return

      const type = info?.type || (daysLate > 0 ? `T+${daysLate}` : 'Due')
      rows.push({ tenant: t, unit, building, bal, daysLate, daysUntil, dueDate, lang, info, type })
    })
    return rows
  }, [tenants, payments, units, buildings, settings])

  const buildMessage = (row, forGuarantor = false) => {
    const { tenant, unit, building, bal, dueDate, lang } = row
    const templates = REMINDER_TEMPLATES[lang] || REMINDER_TEMPLATES.en
    const lateFee = settings.lateFeeValue || 50000
    const total = tenant.rentAmount + lateFee

    if (forGuarantor && templates.guarantor7) {
      return templates.guarantor7(
        tenant.guarantorName,
        tenant,
        unit,
        building,
        building?.address,
        tenant.rentAmount,
        bal.daysLate,
        bal.balance,
        tenant.phone,
      )
    }
    if (row.type === 'T-3' && templates.t3) {
      return templates.t3(tenant, unit, tenant.rentAmount, dueDate, settings.mtnMomo, settings.airtelMoney)
    }
    if (row.type === 'Due' && templates.due) {
      return templates.due(tenant, unit, tenant.rentAmount, dueDate, settings.mtnMomo, settings.airtelMoney)
    }
    if (row.daysLate >= 3 && templates.t3late) {
      return templates.t3late(tenant, unit, tenant.rentAmount, dueDate, building?.caretakerName)
    }
    if (row.daysLate >= 7 && REMINDER_TEMPLATES.en.t7) {
      const followUp = new Date()
      followUp.setDate(followUp.getDate() + 7)
      return REMINDER_TEMPLATES.en.t7(tenant, unit, tenant.rentAmount, lateFee, total, followUp)
    }
    if (row.daysLate >= 14 && REMINDER_TEMPLATES.en.t14) {
      return REMINDER_TEMPLATES.en.t14(tenant.guarantorName, tenant, unit, building, tenant.rentAmount)
    }
    return `Dear ${tenant.firstName}, please pay ${fmtUGX(tenant.rentAmount)} for ${unit?.unitNumber}.`
  }

  const sendReminder = (row, forGuarantor = false) => {
    const msg = buildMessage(row, forGuarantor)
    setPreview({ ...row, message: msg, forGuarantor })
  }

  const confirmSend = () => {
    if (!preview) return
    const hasApi = !!settings.africasTalkingKey
    if (!hasApi) {
      navigator.clipboard?.writeText(preview.message)
      showToast('Copied! Paste into WhatsApp or SMS manually.', 'info')
    } else {
      showToast('Message sent via AfricasTalking', 'success')
    }
    setNotifications?.((prev) => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        type: preview.forGuarantor ? 'guarantor' : 'reminder',
        tenantId: preview.tenant.id,
        message: preview.message,
        date: new Date().toISOString(),
      },
    ])
    if (preview.forGuarantor) {
      setGuarantorLogs?.((prev) => [
        ...prev,
        { id: `gl-${Date.now()}`, tenantId: preview.tenant.id, date: new Date().toISOString(), message: preview.message },
      ])
    }
    setPreview(null)
  }

  const sendBroadcast = () => {
    if (!broadcast.message.trim()) {
      showToast('Enter a broadcast message', 'error')
      return
    }
    const targets = tenants.filter((t) => {
      if (t.status === 'Departed') return false
      if (!broadcast.buildingId) return true
      return t.buildingId === broadcast.buildingId
    })
    setBroadcastHistory?.((prev) => [
      ...prev,
      {
        id: `bc-${Date.now()}`,
        buildingId: broadcast.buildingId || 'all',
        message: broadcast.message,
        language: broadcast.language,
        count: targets.length,
        date: new Date().toISOString(),
      },
    ])
    showToast(`Broadcast logged for ${targets.length} tenants`, 'success')
    setBroadcast({ buildingId: '', message: '', language: 'English' })
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Reminders</h1>

      {reminderRows.length === 0 ? (
        <EmptyState message="No reminders due at this time." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Tenant</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Days</th>
                <th className="p-2">Type</th>
                <th className="p-2">Language</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminderRows.map((row) => (
                <tr key={`rem-${row.tenant.id}-${row.type}`} className="border-b dark:border-gray-700">
                  <td className="p-2">{row.tenant.firstName} {row.tenant.lastName}</td>
                  <td className="p-2">{row.unit?.unitNumber}</td>
                  <td className="p-2">{fmtUGX(row.tenant.rentAmount)}</td>
                  <td className="p-2">{row.daysLate > 0 ? `${row.daysLate} late` : row.daysUntil}</td>
                  <td className="p-2">
                    {row.info ? (
                      <span className={`badge ${row.info.color}`}>{row.info.label}</span>
                    ) : (
                      <Badge color="gray">{row.type}</Badge>
                    )}
                  </td>
                  <td className="p-2">{row.lang === 'lg' ? 'LG' : 'EN'}</td>
                  <td className="p-2 space-x-2">
                    <button type="button" className="text-sm text-blue-600" onClick={() => sendReminder(row)}>Send</button>
                    {row.daysLate >= 7 && (
                      <button type="button" className="text-sm text-red-600" onClick={() => sendReminder(row, true)}>Notify Guarantor</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Building Broadcast</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <select className={inputCls} value={broadcast.buildingId} onChange={(e) => setBroadcast((b) => ({ ...b, buildingId: e.target.value }))}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={`bc-b-${b.id}`} value={b.id}>{b.name}</option>)}
          </select>
          <select className={inputCls} value={broadcast.language} onChange={(e) => setBroadcast((b) => ({ ...b, language: e.target.value }))}>
            <option>English</option>
            <option>Luganda</option>
            <option>Both</option>
          </select>
        </div>
        <textarea
          className={`${inputCls} mt-4 min-h-[100px]`}
          placeholder="Type broadcast message…"
          value={broadcast.message}
          onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))}
        />
        <button type="button" className={`${btnPrimary} mt-4`} onClick={sendBroadcast}>Send to All Tenants</button>
        {broadcastHistory?.length > 0 && (
          <div className="mt-4 table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Building</th>
                  <th className="p-2">Language</th>
                  <th className="p-2">Recipients</th>
                  <th className="p-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {broadcastHistory.map((bc) => (
                  <tr key={`bc-hist-${bc.id}`} className="border-b dark:border-gray-700">
                    <td className="p-2">{fmtDate(bc.date)}</td>
                    <td className="p-2">{bc.buildingId === 'all' ? 'All' : lookupBuilding(buildings, bc.buildingId)?.name}</td>
                    <td className="p-2">{bc.language}</td>
                    <td className="p-2">{bc.count}</td>
                    <td className="p-2">{bc.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Message Preview" wide>
        {preview && (
          <div>
            <p className="whitespace-pre-wrap text-sm mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">{preview.message}</p>
            <LoadingButton className={btnPrimary} onClick={confirmSend}>
              {settings.africasTalkingKey ? 'Send Message' : 'Copy Message'}
            </LoadingButton>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function MaintenancePage({
  maintenance,
  setMaintenance,
  units,
  buildings,
  showToast,
  currentRole,
}) {
  const isCaretaker = currentRole === 'caretaker'
  const [showForm, setShowForm] = useState(false)
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [form, setForm] = useState({ unitId: '', issue: '', reportedBy: 'Caretaker', priority: 'Medium' })
  const [updateRow, setUpdateRow] = useState(null)

  const visibleMaintenance = useMemo(() => {
    let rows = [...maintenance]
    if (isCaretaker) rows = rows.filter((m) => m.status === 'open' || m.status === 'in_progress')
    if (filterBuilding) rows = rows.filter((m) => m.buildingId === filterBuilding)
    if (filterStatus) rows = rows.filter((m) => m.status === filterStatus)
    if (filterPriority) rows = rows.filter((m) => m.priority === filterPriority)
    return rows
  }, [maintenance, isCaretaker, filterBuilding, filterStatus, filterPriority])

  const monthCost = useMemo(() => {
    const now = new Date()
    return maintenance
      .filter((m) => {
        const d = new Date(m.reportedDate)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && m.cost
      })
      .reduce((s, m) => s + (m.cost || 0), 0)
  }, [maintenance])

  const logIssue = () => {
    if (!form.unitId || !form.issue) {
      showToast('Select unit and describe the issue', 'error')
      return
    }
    const unit = lookupUnit(units, form.unitId)
    setMaintenance((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        unitId: form.unitId,
        buildingId: unit?.buildingId,
        issue: form.issue,
        reportedDate: new Date().toISOString().split('T')[0],
        resolvedDate: null,
        status: 'open',
        cost: 0,
        reportedBy: form.reportedBy,
        priority: form.priority,
        notes: '',
        photos: [],
      },
    ])
    setForm({ unitId: '', issue: '', reportedBy: 'Caretaker', priority: 'Medium' })
    setShowForm(false)
    showToast('Maintenance issue logged', 'success')
  }

  const saveUpdate = () => {
    if (!updateRow) return
    setMaintenance((prev) => prev.map((m) => (m.id === updateRow.id ? updateRow : m)))
    setUpdateRow(null)
    showToast('Maintenance updated', 'success')
  }

  const statusBadge = (status) => {
    const colors = { open: 'red', in_progress: 'orange', resolved: 'green' }
    return <Badge color={colors[status] || 'gray'}>{status.replace('_', ' ')}</Badge>
  }

  const escalationClass = (reportedDate, status) => {
    if (status === 'resolved') return ''
    const days = daysOpen(reportedDate)
    if (days >= 14) return 'border-l-4 border-red-600'
    if (days >= 7) return 'border-l-4 border-orange-500'
    return ''
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        {!isCaretaker && (
          <button type="button" className={btnPrimary} onClick={() => setShowForm(true)}>Log Issue</button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <select className={inputCls} value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)}>
          <option value="">All Buildings</option>
          {buildings.map((b) => <option key={`mf-b-${b.id}`} value={b.id}>{b.name}</option>)}
        </select>
        <select className={inputCls} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className={inputCls} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>

      {visibleMaintenance.length === 0 ? (
        <EmptyState message="No maintenance issues recorded." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Building</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Issue</th>
                <th className="p-2">Reported</th>
                <th className="p-2">Status</th>
                <th className="p-2">Priority</th>
                {!isCaretaker && <th className="p-2">Cost</th>}
                <th className="p-2">Days Open</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleMaintenance.map((m) => {
                const unit = lookupUnit(units, m.unitId)
                const building = lookupBuilding(buildings, m.buildingId)
                const openDays = daysOpen(m.reportedDate)
                return (
                  <tr key={`maint-${m.id}`} className={`border-b dark:border-gray-700 ${escalationClass(m.reportedDate, m.status)}`}>
                    <td className="p-2">{building?.name}</td>
                    <td className="p-2">{unit?.unitNumber}</td>
                    <td className="p-2">{m.issue}</td>
                    <td className="p-2">{fmtDate(m.reportedDate)}</td>
                    <td className="p-2">{statusBadge(m.status)}</td>
                    <td className="p-2">{m.priority}</td>
                    {!isCaretaker && <td className="p-2">{fmtUGX(m.cost)}</td>}
                    <td className="p-2">
                      {openDays}
                      {openDays >= 14 && m.status !== 'resolved' && <Badge color="darkred">OVERDUE</Badge>}
                    </td>
                    <td className="p-2">
                      <button type="button" className="text-sm text-[#2d6a4f]" onClick={() => setUpdateRow({ ...m })}>Update</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isCaretaker && (
        <p className="text-sm font-medium">Total maintenance costs this month: {fmtUGX(monthCost)}</p>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Log Maintenance Issue">
        <div className="space-y-4">
          <select className={inputCls} value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}>
            <option value="">Select unit…</option>
            {units.map((u) => {
              const building = lookupBuilding(buildings, u.buildingId)
              return (
                <option key={`log-u-${u.id}`} value={u.id}>{building?.name} — {u.unitNumber}</option>
              )
            })}
          </select>
          <textarea className={inputCls} placeholder="Issue description" value={form.issue} onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))} />
          <input className={inputCls} placeholder="Reported by" value={form.reportedBy} onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))} />
          <select className={inputCls} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
          <button type="button" className={btnPrimary} onClick={logIssue}>Save Issue</button>
        </div>
      </Modal>

      <Modal open={!!updateRow} onClose={() => setUpdateRow(null)} title="Update Maintenance">
        {updateRow && (
          <div className="space-y-4">
            <p className="font-medium">{updateRow.issue}</p>
            <select
              className={inputCls}
              value={updateRow.status}
              onChange={(e) => setUpdateRow((r) => ({ ...r, status: e.target.value, resolvedDate: e.target.value === 'resolved' ? new Date().toISOString().split('T')[0] : null }))}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            {!isCaretaker && (
              <input type="number" className={inputCls} placeholder="Cost (UGX)" value={updateRow.cost || ''} onChange={(e) => setUpdateRow((r) => ({ ...r, cost: Number(e.target.value) }))} />
            )}
            <textarea className={inputCls} placeholder="Notes" value={updateRow.notes || ''} onChange={(e) => setUpdateRow((r) => ({ ...r, notes: e.target.value }))} />
            <button type="button" className={btnPrimary} onClick={saveUpdate}>Save Update</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
