import React, { useMemo, useState } from 'react'
import {
  fmtUGX,
  fmtDate,
  getTenantBalance,
  getBalanceStatus,
  getRowColor,
  exportCSV,
  downloadText,
  parseMoMoCSV,
} from '../utils/helpers'
import { generateReceiptNo } from '../utils/receipts'
import { CHECKLIST_ITEMS } from '../data/mockData'
import { Modal, Badge, EmptyState, LoadingButton, StatCard } from '../components/UI'

const inputCls = 'w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600'
const btnPrimary = 'px-4 py-2 bg-[#2d6a4f] text-white rounded hover:opacity-90'
const btnSecondary = 'px-4 py-2 border rounded dark:border-gray-600'

function lookupTenant(tenants, id) {
  return tenants.find((t) => t.id === id)
}

function lookupUnit(units, id) {
  return units.find((u) => u.id === id)
}

function lookupBuilding(buildings, id) {
  return buildings.find((b) => b.id === id)
}

function MomoReconciliation({ payments, tenants, units, setPayments, showToast }) {
  const [csvRows, setCsvRows] = useState([])
  const [assignTenant, setAssignTenant] = useState({})

  const { matched, unmatched } = useMemo(() => {
    const refs = new Set(payments.map((p) => (p.reference || '').toLowerCase()).filter(Boolean))
    const m = []
    const u = []
    csvRows.forEach((row) => {
      const ref = (row.reference || '').toLowerCase()
      if (ref && refs.has(ref)) m.push(row)
      else u.push(row)
    })
    return { matched: m, unmatched: u }
  }, [csvRows, payments])

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseMoMoCSV(String(reader.result || ''))
      setCsvRows(rows)
      showToast(`Parsed ${rows.length} transactions from CSV`, 'info')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const assignToTenant = (row) => {
    const tenantId = assignTenant[row.id]
    if (!tenantId) {
      showToast('Select a tenant first', 'error')
      return
    }
    const tenant = lookupTenant(tenants, tenantId)
    const payment = {
      id: `p-momo-${Date.now()}`,
      tenantId,
      unitId: tenant?.unitId,
      buildingId: tenant?.buildingId,
      amount: row.amount,
      date: row.date || new Date().toISOString().split('T')[0],
      method: 'MTN MoMo',
      reference: row.reference,
      period: fmtDate(row.date),
      type: 'rent',
      notes: 'MoMo reconciliation',
      receiptSent: true,
      receiptNo: generateReceiptNo(payments),
    }
    setPayments((prev) => [...prev, payment])
    setCsvRows((prev) => prev.filter((r) => r.id !== row.id))
    showToast(`Assigned ${fmtUGX(row.amount)} to ${tenant?.firstName} ${tenant?.lastName}`, 'success')
  }

  const exportRecon = () => {
    exportCSV('momo-reconciliation.csv', ['Status', 'Date', 'Amount', 'Reference'], [
      ...matched.map((r) => ['Matched', r.date, r.amount, r.reference]),
      ...unmatched.map((r) => ['Unmatched', r.date, r.amount, r.reference]),
    ])
  }

  return (
    <div className="card p-4 mt-6">
      <h3 className="font-semibold text-lg mb-2">MoMo Reconciliation</h3>
      <p className="text-sm text-gray-500 mb-3">
        Download your MTN MoMo or Airtel Money transaction history as CSV and upload here.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={handleUpload} className="text-sm mb-4" />
      {csvRows.length > 0 && (
        <>
          <p className="text-sm mb-4">
            <strong>{matched.length}</strong> payments matched automatically. <strong>{unmatched.length}</strong> need manual assignment.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Matched ({matched.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matched.map((row) => (
                  <div key={`match-${row.id}`} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                    {fmtDate(row.date)} — {fmtUGX(row.amount)} — {row.reference}
                  </div>
                ))}
                {matched.length === 0 && <p className="text-gray-400 text-sm">No matches yet</p>}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-700 mb-2">Unmatched ({unmatched.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unmatched.map((row) => (
                  <div key={`unmatch-${row.id}`} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                    <div>{fmtDate(row.date)} — {fmtUGX(row.amount)} — {row.reference}</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <select
                        className={`${inputCls} text-xs flex-1`}
                        value={assignTenant[row.id] || ''}
                        onChange={(e) => setAssignTenant((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      >
                        <option value="">Assign to tenant…</option>
                        {tenants.filter((t) => t.status !== 'Departed').map((t) => {
                          const unit = lookupUnit(units, t.unitId)
                          return (
                            <option key={`assign-opt-${row.id}-${t.id}`} value={t.id}>
                              {t.firstName} {t.lastName} — {unit?.unitNumber}
                            </option>
                          )
                        })}
                      </select>
                      <button type="button" className={`${btnPrimary} text-xs`} onClick={() => assignToTenant(row)}>
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
                {unmatched.length === 0 && <p className="text-gray-400 text-sm">All transactions matched</p>}
              </div>
            </div>
          </div>
          <button type="button" className={`${btnSecondary} mt-4`} onClick={exportRecon}>
            Export Reconciliation Report
          </button>
        </>
      )}
    </div>
  )
}

export function PaymentsPage({
  tenants,
  payments,
  setPayments,
  units,
  buildings,
  showToast,
  onPaymentSaved,
}) {
  const [form, setForm] = useState({
    tenantId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'MTN MoMo',
    reference: '',
    period: '',
    notes: '',
  })
  const [tenantSearch, setTenantSearch] = useState('')
  const [search, setSearch] = useState('')
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [saving, setSaving] = useState(false)

  const filteredTenants = useMemo(() => {
    const q = tenantSearch.toLowerCase()
    return tenants.filter((t) => {
      const unit = lookupUnit(units, t.unitId)
      const label = `${t.firstName} ${t.lastName} ${unit?.unitNumber || ''}`.toLowerCase()
      return !q || label.includes(q)
    })
  }, [tenants, units, tenantSearch])

  const filteredPayments = useMemo(() => {
    let rows = [...payments]
    const q = search.toLowerCase()
    if (q) {
      rows = rows.filter((p) => {
        const tenant = lookupTenant(tenants, p.tenantId)
        const name = `${tenant?.firstName || ''} ${tenant?.lastName || ''}`.toLowerCase()
        return name.includes(q) || (p.reference || '').toLowerCase().includes(q)
      })
    }
    if (filterBuilding) rows = rows.filter((p) => p.buildingId === filterBuilding)
    if (filterMethod) rows = rows.filter((p) => p.method === filterMethod)
    if (filterMonth) {
      rows = rows.filter((p) => new Date(p.date).getMonth() + 1 === Number(filterMonth))
    }
    if (filterYear) {
      rows = rows.filter((p) => new Date(p.date).getFullYear() === Number(filterYear))
    }
    rows.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'tenant') {
        const ta = lookupTenant(tenants, a.tenantId)
        const tb = lookupTenant(tenants, b.tenantId)
        av = `${ta?.lastName || ''}${ta?.firstName || ''}`
        bv = `${tb?.lastName || ''}${tb?.firstName || ''}`
      }
      if (sortKey === 'amount') return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [payments, tenants, search, filterBuilding, filterMethod, filterMonth, filterYear, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const savePayment = () => {
    if (!form.tenantId || !form.amount) {
      showToast('Select tenant and enter amount', 'error')
      return
    }
    setSaving(true)
    const tenant = lookupTenant(tenants, form.tenantId)
    const payment = {
      id: `p-${Date.now()}`,
      tenantId: form.tenantId,
      unitId: tenant?.unitId,
      buildingId: tenant?.buildingId,
      amount: Number(form.amount),
      date: form.date,
      method: form.method,
      reference: form.reference,
      period: form.period,
      type: 'rent',
      notes: form.notes,
      receiptSent: true,
      receiptNo: generateReceiptNo(payments),
    }
    setPayments((prev) => [...prev, payment])
    setForm({
      tenantId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'MTN MoMo',
      reference: '',
      period: '',
      notes: '',
    })
    setTenantSearch('')
    onPaymentSaved?.(payment)
    showToast('Payment saved — receipt generated', 'success')
    setTimeout(() => setSaving(false), 400)
  }

  const exportPayments = () => {
    exportCSV('payments.csv', ['Date', 'Tenant', 'Unit', 'Amount', 'Method', 'Reference', 'Period'], filteredPayments.map((p) => {
      const tenant = lookupTenant(tenants, p.tenantId)
      const unit = lookupUnit(units, p.unitId)
      return [p.date, `${tenant?.firstName} ${tenant?.lastName}`, unit?.unitNumber, p.amount, p.method, p.reference, p.period]
    }))
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Record Payment</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Search Tenant</label>
            <input className={inputCls} value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} placeholder="Search by name or unit…" />
            <select className={`${inputCls} mt-2`} value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}>
              <option value="">Select tenant…</option>
              {filteredTenants.map((t) => {
                const unit = lookupUnit(units, t.unitId)
                return (
                  <option key={`pay-tenant-${t.id}`} value={t.id}>
                    {t.firstName} {t.lastName} — {unit?.unitNumber}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Amount (UGX)</label>
            <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Payment Date</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Method</label>
            <select className={inputCls} value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
              <option>MTN MoMo</option>
              <option>Airtel Money</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Reference / Transaction ID</label>
            <input className={inputCls} value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Period (Month/Year)</label>
            <input className={inputCls} value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="July 2026" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Notes</label>
            <input className={inputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <LoadingButton loading={saving} className={`${btnPrimary} mt-4 w-full sm:w-auto`} onClick={savePayment}>
          Save Payment
        </LoadingButton>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <h2 className="font-semibold">All Payments</h2>
          <button type="button" className={btnSecondary} onClick={exportPayments}>Export CSV</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          <input className={inputCls} placeholder="Search tenant or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={inputCls} value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map((b) => <option key={`fb-${b.id}`} value={b.id}>{b.name}</option>)}
          </select>
          <select className={inputCls} value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="">All Methods</option>
            <option>MTN MoMo</option>
            <option>Airtel Money</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
          </select>
          <select className={inputCls} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={`mo-${i + 1}`} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className={inputCls} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {[2026, 2025, 2024].map((y) => <option key={`yr-${y}`} value={y}>{y}</option>)}
          </select>
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState message="No payments recorded yet. Click Record Payment above." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('date')}>Date</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('tenant')}>Tenant</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort('amount')}>Amount</th>
                  <th className="p-2">Method</th>
                  <th className="p-2">Reference</th>
                  <th className="p-2">Period</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const tenant = lookupTenant(tenants, p.tenantId)
                  const unit = lookupUnit(units, p.unitId)
                  return (
                    <tr key={`payment-row-${p.id}`} className="border-b dark:border-gray-700">
                      <td className="p-2">{fmtDate(p.date)}</td>
                      <td className="p-2">{tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'}</td>
                      <td className="p-2">{unit?.unitNumber || '—'}</td>
                      <td className="p-2">{fmtUGX(p.amount)}</td>
                      <td className="p-2">{p.method}</td>
                      <td className="p-2">{p.reference}</td>
                      <td className="p-2">{p.period}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MomoReconciliation
        payments={payments}
        tenants={tenants}
        units={units}
        setPayments={setPayments}
        showToast={showToast}
      />
    </div>
  )
}

export function BalanceTrackerPage({
  tenants,
  payments,
  units,
  buildings,
  settings,
  showToast,
  setPayments,
  setNotifications,
}) {
  const [sortBy, setSortBy] = useState('arrears')

  const rows = useMemo(() => {
    const data = tenants
      .filter((t) => t.status !== 'Departed')
      .map((t) => {
        const bal = getTenantBalance(t.id, tenants, payments)
        const unit = lookupUnit(units, t.unitId)
        const building = lookupBuilding(buildings, t.buildingId)
        const status = getBalanceStatus(bal.daysLate)
        return { tenant: t, unit, building, bal, status }
      })

    if (sortBy === 'arrears') data.sort((a, b) => b.bal.balance - a.bal.balance)
    else if (sortBy === 'alpha') data.sort((a, b) => `${a.tenant.lastName}`.localeCompare(b.tenant.lastName))
    else if (sortBy === 'unit') data.sort((a, b) => `${a.unit?.unitNumber || ''}`.localeCompare(b.unit?.unitNumber || ''))
    return data
  }, [tenants, payments, units, buildings, sortBy])

  const sendReminder = (row) => {
    const msg = `Dear ${row.tenant.firstName}, your rent of ${fmtUGX(row.tenant.rentAmount)} for ${row.unit?.unitNumber} is ${row.bal.daysLate > 0 ? `${row.bal.daysLate} days overdue` : 'due soon'}. Pay via MTN MoMo ${settings.mtnMomo} or Airtel Money ${settings.airtelMoney}.`
    setNotifications?.((prev) => [
      ...prev,
      { id: `n-${Date.now()}`, type: 'reminder', tenantId: row.tenant.id, message: msg, date: new Date().toISOString() },
    ])
    showToast('Reminder logged', 'success')
  }

  const exportDefaulters = () => {
    const defaulters = rows.filter((r) => r.bal.balance > 0)
    exportCSV('defaulters.csv', ['Tenant', 'Unit', 'Building', 'Balance', 'Days Late', 'Phone'], defaulters.map((r) => [
      `${r.tenant.firstName} ${r.tenant.lastName}`,
      r.unit?.unitNumber,
      r.building?.name,
      r.bal.balance,
      r.bal.daysLate,
      r.tenant.phone,
    ]))
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">Balance Tracker</h1>
        <div className="flex gap-2 flex-wrap">
          <select className={inputCls} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="arrears">Most in Arrears</option>
            <option value="alpha">Alphabetical</option>
            <option value="unit">Unit Number</option>
          </select>
          <button type="button" className={btnSecondary} onClick={exportDefaulters}>Export Defaulters</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No tenants to track." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Tenant</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Building</th>
                <th className="p-2">Monthly Rent</th>
                <th className="p-2">Total Due</th>
                <th className="p-2">Total Paid</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Days Late</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`bal-${row.tenant.id}`} className={`border-b dark:border-gray-700 ${getRowColor(row.bal.daysLate)}`}>
                  <td className="p-2">{row.tenant.firstName} {row.tenant.lastName}</td>
                  <td className="p-2">{row.unit?.unitNumber}</td>
                  <td className="p-2">{row.building?.name}</td>
                  <td className="p-2">{fmtUGX(row.tenant.rentAmount)}</td>
                  <td className="p-2">{fmtUGX(row.bal.totalDue)}</td>
                  <td className="p-2">{fmtUGX(row.bal.totalPaid)}</td>
                  <td className="p-2 font-semibold">{fmtUGX(row.bal.balance)}</td>
                  <td className="p-2">{row.bal.daysLate}</td>
                  <td className="p-2">
                    <Badge color={row.status === 'clear' ? 'green' : row.status === 'late' ? 'orange' : 'red'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <button type="button" className="text-sm text-blue-600" onClick={() => sendReminder(row)}>Send Reminder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MomoReconciliation
        payments={payments}
        tenants={tenants}
        units={units}
        setPayments={setPayments}
        showToast={showToast}
      />
    </div>
  )
}

export function DepositsPage({
  tenants,
  setTenants,
  units,
  buildings,
  setDepositHistory,
  showToast,
}) {
  const [settleTenant, setSettleTenant] = useState(null)
  const [deductions, setDeductions] = useState([])
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0])
  const [checklistTenant, setChecklistTenant] = useState('')
  const [checklist, setChecklist] = useState(() =>
    Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, { condition: 'Good', notes: '' }])),
  )

  const depositRows = useMemo(() =>
    tenants.map((t) => {
      const unit = lookupUnit(units, t.unitId)
      const building = lookupBuilding(buildings, t.buildingId)
      let status = 'NOT PAID'
      let color = 'red'
      if (t.depositPaid >= t.depositAmount) {
        status = 'PAID IN FULL'
        color = 'green'
      } else if (t.depositPaid > 0) {
        status = 'PARTIAL'
        color = 'orange'
      }
      if (t.status === 'Departed') {
        status = 'REFUNDED'
        color = 'gray'
      }
      const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount || 0), 0)
      const refundDue = Math.max(0, (t.depositPaid || 0) - totalDeductions)
      return { tenant: t, unit, building, status, color, refundDue }
    }),
  [tenants, units, buildings, deductions])

  const openSettlement = (tenant) => {
    setSettleTenant(tenant)
    setDeductions([])
    setMoveOutDate(new Date().toISOString().split('T')[0])
  }

  const addDeduction = () => {
    setDeductions((prev) => [...prev, { id: `ded-${Date.now()}`, description: '', amount: '' }])
  }

  const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount || 0), 0)
  const depositPaid = settleTenant?.depositPaid || 0
  const netRefund = depositPaid - totalDeductions

  const generateSettlementLetter = () => {
    if (!settleTenant) return
    const unit = lookupUnit(units, settleTenant.unitId)
    const building = lookupBuilding(buildings, settleTenant.buildingId)
    const dedLines = deductions.map((d) => `  - ${d.description}: ${fmtUGX(d.amount)}`).join('\n')
    const text = `DEPOSIT SETTLEMENT LETTER
Date: ${fmtDate(new Date())}

Tenant: ${settleTenant.firstName} ${settleTenant.lastName} | Unit ${unit?.unitNumber} | ${building?.name}
Move-out Date: ${fmtDate(moveOutDate)}

Deposit Paid: ${fmtUGX(depositPaid)}

DEDUCTIONS:
${dedLines || '  (none)'}
Total Deductions: ${fmtUGX(totalDeductions)}

${netRefund >= 0 ? `NET REFUND DUE: ${fmtUGX(netRefund)}` : `AMOUNT STILL OWED: ${fmtUGX(Math.abs(netRefund))}`}

Refund to be paid within 30 days of move-out per Landlord and Tenant Act 2019.

Signed: _____________ Date: _______`
    downloadText(`settlement-${settleTenant.id}.txt`, text)
    setDepositHistory?.((prev) => [
      ...prev,
      { id: `dh-${Date.now()}`, tenantId: settleTenant.id, date: new Date().toISOString(), netRefund, deductions: [...deductions] },
    ])
    showToast('Settlement letter downloaded', 'success')
  }

  const markDeparted = () => {
    if (!settleTenant) return
    setTenants((prev) => prev.map((t) => (t.id === settleTenant.id ? { ...t, status: 'Departed' } : t)))
    generateSettlementLetter()
    setSettleTenant(null)
  }

  const saveChecklist = () => {
    if (!checklistTenant) {
      showToast('Select a tenant for checklist', 'error')
      return
    }
    showToast('Move-in checklist saved to unit record', 'success')
  }

  const printChecklist = () => {
    const tenant = lookupTenant(tenants, checklistTenant)
    const unit = lookupUnit(units, tenant?.unitId)
    const lines = CHECKLIST_ITEMS.map((item) => {
      const c = checklist[item]
      return `${item}: ${c.condition} — ${c.notes || 'No notes'}`
    }).join('\n')
    downloadText(`checklist-${tenant?.id || 'new'}.txt`, `MOVE-IN CONDITION CHECKLIST\nUnit: ${unit?.unitNumber}\nTenant: ${tenant?.firstName} ${tenant?.lastName}\n\n${lines}`)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Deposits</h1>

      <div className="card table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="p-2">Tenant</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Deposit Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {depositRows.map((row) => (
              <tr key={`dep-${row.tenant.id}`} className="border-b dark:border-gray-700">
                <td className="p-2">{row.tenant.firstName} {row.tenant.lastName}</td>
                <td className="p-2">{row.unit?.unitNumber}</td>
                <td className="p-2">{fmtUGX(row.tenant.depositAmount)}</td>
                <td className="p-2"><Badge color={row.color}>{row.status}</Badge></td>
                <td className="p-2">{fmtUGX(row.tenant.depositPaid)}</td>
                <td className="p-2">
                  <button type="button" className="text-sm text-[#2d6a4f]" onClick={() => openSettlement(row.tenant)}>
                    Settle on Depart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Move-In Condition Checklist</h2>
        <select className={`${inputCls} mb-4 max-w-md`} value={checklistTenant} onChange={(e) => setChecklistTenant(e.target.value)}>
          <option value="">Select new tenant…</option>
          {tenants.filter((t) => t.status === 'Active').map((t) => (
            <option key={`chk-tenant-${t.id}`} value={t.id}>{t.firstName} {t.lastName}</option>
          ))}
        </select>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div key={`chk-item-${item}`} className="border rounded p-3 dark:border-gray-600">
              <p className="font-medium text-sm mb-2">{item}</p>
              <select
                className={`${inputCls} text-sm mb-2`}
                value={checklist[item].condition}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: { ...prev[item], condition: e.target.value } }))}
              >
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
              </select>
              <input
                className={`${inputCls} text-sm`}
                placeholder="Notes"
                value={checklist[item].notes}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: { ...prev[item], notes: e.target.value } }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button type="button" className={btnPrimary} onClick={saveChecklist}>Save Checklist</button>
          <button type="button" className={btnSecondary} onClick={printChecklist}>Print Checklist</button>
        </div>
      </div>

      <Modal open={!!settleTenant} onClose={() => setSettleTenant(null)} title="Deposit Settlement" wide>
        {settleTenant && (
          <div className="space-y-4">
            <p>Deposit originally paid: <strong>{fmtUGX(settleTenant.depositPaid)}</strong></p>
            <div>
              <label className="block text-sm mb-1">Move-out Date</label>
              <input type="date" className={inputCls} value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Deductions</h3>
                <button type="button" className="text-sm text-[#2d6a4f]" onClick={addDeduction}>+ Add deduction</button>
              </div>
              {deductions.map((d) => (
                <div key={`ded-row-${d.id}`} className="grid sm:grid-cols-2 gap-2 mb-2">
                  <input
                    className={inputCls}
                    placeholder="Description (e.g. Broken window)"
                    value={d.description}
                    onChange={(e) => setDeductions((prev) => prev.map((x) => (x.id === d.id ? { ...x, description: e.target.value } : x)))}
                  />
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Amount"
                    value={d.amount}
                    onChange={(e) => setDeductions((prev) => prev.map((x) => (x.id === d.id ? { ...x, amount: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
            <StatCard
              label={netRefund >= 0 ? 'Net Refund Due' : 'Amount Still Owed'}
              value={fmtUGX(Math.abs(netRefund))}
              color={netRefund >= 0 ? '#2d6a4f' : '#d62828'}
            />
            <div className="flex gap-2 flex-wrap">
              <button type="button" className={btnSecondary} onClick={generateSettlementLetter}>Download Settlement Letter</button>
              <button type="button" className={btnPrimary} onClick={markDeparted}>Mark as Departed &amp; Settle</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function UtilitiesPage({ utilities, setUtilities, buildings, units, showToast }) {
  const [form, setForm] = useState({
    buildingId: '',
    unitId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: 'Water',
    amount: '',
    notes: '',
    splitUnits: '',
  })
  const [useSplit, setUseSplit] = useState(false)

  const saveUtility = () => {
    if (!form.buildingId || !form.amount) {
      showToast('Select building and enter amount', 'error')
      return
    }
    const amount = useSplit && form.splitUnits
      ? Math.round(Number(form.amount) / Number(form.splitUnits))
      : Number(form.amount)
    const entry = {
      id: `ut-${Date.now()}`,
      buildingId: form.buildingId,
      unitId: form.unitId || null,
      month: Number(form.month),
      year: Number(form.year),
      type: form.type,
      amount,
      notes: form.notes,
      ...(useSplit && form.splitUnits ? { splitUnits: Number(form.splitUnits) } : {}),
    }
    setUtilities((prev) => [...prev, entry])
    showToast('Utility charge saved', 'success')
    setForm((f) => ({ ...f, amount: '', notes: '', splitUnits: '' }))
  }

  const buildingUnits = units.filter((u) => u.buildingId === form.buildingId)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Utilities</h1>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Utility Entry</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Building</label>
            <select className={inputCls} value={form.buildingId} onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value, unitId: '' }))}>
              <option value="">Select…</option>
              {buildings.map((b) => <option key={`util-b-${b.id}`} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Unit (optional)</label>
            <select className={inputCls} value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}>
              <option value="">Building-wide / shared</option>
              {buildingUnits.map((u) => <option key={`util-u-${u.id}`} value={u.id}>{u.unitNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Utility Type</label>
            <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option>Water</option>
              <option>Electricity</option>
              <option>Garbage</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Month</label>
            <select className={inputCls} value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={`util-mo-${i + 1}`} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Year</label>
            <input type="number" className={inputCls} value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Amount (UGX)</label>
            <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Notes</label>
            <input className={inputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm">
          <input type="checkbox" checked={useSplit} onChange={(e) => setUseSplit(e.target.checked)} />
          Split bill equally across multiple units
        </label>
        {useSplit && (
          <div className="mt-2 max-w-xs">
            <label className="block text-sm mb-1">Number of units to split</label>
            <input type="number" className={inputCls} value={form.splitUnits} onChange={(e) => setForm((f) => ({ ...f, splitUnits: e.target.value }))} min="1" />
            {form.amount && form.splitUnits && (
              <p className="text-sm text-gray-500 mt-1">Per unit: {fmtUGX(Math.round(Number(form.amount) / Number(form.splitUnits)))}</p>
            )}
          </div>
        )}
        <button type="button" className={`${btnPrimary} mt-4`} onClick={saveUtility}>Save Utility</button>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Utility Charges</h2>
        {utilities.length === 0 ? (
          <EmptyState message="No utility charges recorded yet." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Building</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Period</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {utilities.map((ut) => {
                  const building = lookupBuilding(buildings, ut.buildingId)
                  const unit = lookupUnit(units, ut.unitId)
                  return (
                    <tr key={`util-row-${ut.id}`} className="border-b dark:border-gray-700">
                      <td className="p-2">{building?.name}</td>
                      <td className="p-2">{unit?.unitNumber || (ut.splitUnits ? `Split ×${ut.splitUnits}` : '—')}</td>
                      <td className="p-2">{ut.month}/{ut.year}</td>
                      <td className="p-2">{ut.type}</td>
                      <td className="p-2">{fmtUGX(ut.amount)}</td>
                      <td className="p-2">{ut.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
