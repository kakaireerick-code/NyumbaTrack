import React, { useMemo, useState } from 'react'
import {
  fmtUGX,
  fmtDate,
  getTenantBalance,
  getRowColor,
  exportCSV,
  downloadText,
  ugandaFYOptions,
  daysBetween,
} from '../utils/helpers'
import { safeSet } from '../utils/storage'
import { Badge, EmptyState, LoadingButton, StatCard } from '../components/UI'

const inputCls = 'w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600'
const btnPrimary = 'px-4 py-2 bg-[#2d6a4f] text-white rounded hover:opacity-90'
const btnSecondary = 'px-4 py-2 border rounded dark:border-gray-600'

const LTA_SUMMARY = `Key tenant rights under Uganda's Landlord and Tenant Act 2019:
- 2 months notice required for rent increases
- Receipt must be provided for every payment
- Security deposit cannot exceed 3 months rent
- 7 days notice required before landlord entry
- Eviction requires court order after proper notice`

function lookupTenant(tenants, id) {
  return tenants.find((t) => t.id === id)
}

function lookupUnit(units, id) {
  return units.find((u) => u.id === id)
}

function lookupBuilding(buildings, id) {
  return buildings.find((b) => b.id === id)
}

export function ReportsPage({ tenants, payments, units, buildings, maintenance }) {
  const [tab, setTab] = useState('monthly')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [defaulterDays, setDefaulterDays] = useState(7)
  const [fyIndex, setFyIndex] = useState(0)
  const fyOptions = useMemo(() => ugandaFYOptions(), [])

  const monthlyReport = useMemo(() => {
    const rentPayments = payments.filter((p) => {
      const d = new Date(p.date)
      return p.type === 'rent' && d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year)
    })
    const expected = tenants.filter((t) => t.status !== 'Departed').reduce((s, t) => s + t.rentAmount, 0)
    const collected = rentPayments.reduce((s, p) => s + p.amount, 0)
    const outstanding = Math.max(0, expected - collected)
    const occupied = units.filter((u) => u.status === 'occupied').length
    const occupancy = units.length ? Math.round((occupied / units.length) * 100) : 0
    return { expected, collected, outstanding, occupancy, rentPayments }
  }, [payments, tenants, units, month, year])

  const defaulterReport = useMemo(() =>
    tenants
      .filter((t) => t.status !== 'Departed')
      .map((t) => {
        const bal = getTenantBalance(t.id, tenants, payments)
        const unit = lookupUnit(units, t.unitId)
        const building = lookupBuilding(buildings, t.buildingId)
        return { tenant: t, unit, building, bal }
      })
      .filter((r) => r.bal.daysLate >= Number(defaulterDays)),
  [tenants, payments, units, buildings, defaulterDays])

  const unitRevenue = useMemo(() =>
    units.map((u) => {
      const unitPayments = payments.filter((p) => p.unitId === u.id && p.type === 'rent')
      const collected = unitPayments.reduce((s, p) => s + p.amount, 0)
      const expected = u.monthlyRent * 12
      const tenant = lookupTenant(tenants, u.currentTenantId)
      const monthsOccupied = tenant
        ? Math.max(1, Math.floor((new Date() - new Date(tenant.leaseStart)) / (1000 * 60 * 60 * 24 * 30)))
        : 0
      const arrears = tenant ? getTenantBalance(tenant.id, tenants, payments).balance : 0
      return { unit: u, collected, expected, monthsOccupied, arrears, building: lookupBuilding(buildings, u.buildingId) }
    }),
  [units, payments, tenants, buildings])

  const uraReport = useMemo(() => {
    const fy = fyOptions[fyIndex]
    if (!fy) return { rows: [], total: 0 }
    const rows = buildings.map((b) => {
      const bUnits = units.filter((u) => u.buildingId === b.id)
      const annual = payments
        .filter((p) => {
          const d = new Date(p.date)
          return p.buildingId === b.id && p.type === 'rent' && d >= fy.start && d <= fy.end
        })
        .reduce((s, p) => s + p.amount, 0)
      return { building: b, unitCount: bUnits.length, annual, avgMonthly: Math.round(annual / 12) }
    })
    const total = rows.reduce((s, r) => s + r.annual, 0)
    const taxEstimate = total > 2820000 ? Math.round((total - 2820000) * 0.2) : 0
    return { rows, total, taxEstimate, fy }
  }, [buildings, units, payments, fyOptions, fyIndex])

  const profitability = useMemo(() => {
    const rows = units.map((u) => {
      const rentCollected = payments.filter((p) => p.unitId === u.id && p.type === 'rent').reduce((s, p) => s + p.amount, 0)
      const maintCost = maintenance.filter((m) => m.unitId === u.id).reduce((s, m) => s + (m.cost || 0), 0)
      const tenant = lookupTenant(tenants, u.currentTenantId)
      const monthsOccupied = tenant
        ? Math.max(1, Math.floor((new Date() - new Date(tenant.leaseStart)) / (1000 * 60 * 60 * 24 * 30)))
        : 0
      const expected = u.monthlyRent * monthsOccupied
      const net = rentCollected - maintCost
      const pct = expected > 0 ? Math.round((net / expected) * 100) : 0
      const color = pct > 90 ? 'green' : pct >= 70 ? 'orange' : 'red'
      return { unit: u, rentCollected, maintCost, net, pct, monthsOccupied, color, building: lookupBuilding(buildings, u.buildingId) }
    })
    const sorted = [...rows].sort((a, b) => b.net - a.net)
    return { rows, best: sorted[0], worst: sorted[sorted.length - 1] }
  }, [units, payments, maintenance, tenants, buildings])

  const tabs = [
    { id: 'monthly', label: 'Monthly Summary' },
    { id: 'defaulter', label: 'Defaulter Report' },
    { id: 'unit-revenue', label: 'Per-Unit Revenue' },
    { id: 'ura', label: 'URA Rental Income' },
    { id: 'profitability', label: 'Unit Profitability' },
  ]

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={`tab-${t.id}`}
            type="button"
            className={`px-3 py-1.5 rounded text-sm ${tab === t.id ? 'bg-[#2d6a4f] text-white' : 'border dark:border-gray-600'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={`rep-mo-${i + 1}`} value={i + 1}>{new Date(2000, i, 1).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" className={`${inputCls} max-w-[120px]`} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Expected Collections" value={fmtUGX(monthlyReport.expected)} />
            <StatCard label="Actual Collected" value={fmtUGX(monthlyReport.collected)} color="#40916c" />
            <StatCard label="Outstanding" value={fmtUGX(monthlyReport.outstanding)} color="#d62828" />
            <StatCard label="Occupancy Rate" value={`${monthlyReport.occupancy}%`} />
          </div>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => exportCSV(`monthly-${month}-${year}.csv`, ['Metric', 'Value'], [
              ['Expected', monthlyReport.expected],
              ['Collected', monthlyReport.collected],
              ['Outstanding', monthlyReport.outstanding],
              ['Occupancy %', monthlyReport.occupancy],
            ])}
          >
            Download CSV
          </button>
        </div>
      )}

      {tab === 'defaulter' && (
        <div className="space-y-4">
          <select className={`${inputCls} max-w-xs`} value={defaulterDays} onChange={(e) => setDefaulterDays(e.target.value)}>
            <option value={7}>7+ days late</option>
            <option value={14}>14+ days late</option>
            <option value={30}>30+ days late</option>
            <option value={60}>60+ days late</option>
          </select>
          <div className="card table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Days Late</th>
                  <th className="p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {defaulterReport.map((r) => (
                  <tr key={`def-rep-${r.tenant.id}`} className={`border-b dark:border-gray-700 ${getRowColor(r.bal.daysLate)}`}>
                    <td className="p-2">{r.tenant.firstName} {r.tenant.lastName}</td>
                    <td className="p-2">{r.unit?.unitNumber}</td>
                    <td className="p-2">{r.tenant.phone}</td>
                    <td className="p-2">{r.bal.daysLate}</td>
                    <td className="p-2">{fmtUGX(r.bal.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => exportCSV('defaulter-report.csv', ['Tenant', 'Unit', 'Phone', 'Days Late', 'Balance'], defaulterReport.map((r) => [
              `${r.tenant.firstName} ${r.tenant.lastName}`, r.unit?.unitNumber, r.tenant.phone, r.bal.daysLate, r.bal.balance,
            ]))}
          >
            Export CSV
          </button>
        </div>
      )}

      {tab === 'unit-revenue' && (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Unit</th>
                <th className="p-2">Building</th>
                <th className="p-2">Expected Annual</th>
                <th className="p-2">Collected</th>
                <th className="p-2">Arrears</th>
                <th className="p-2">Occupancy Months</th>
              </tr>
            </thead>
            <tbody>
              {unitRevenue.map((r) => (
                <tr key={`urev-${r.unit.id}`} className="border-b dark:border-gray-700">
                  <td className="p-2">{r.unit.unitNumber}</td>
                  <td className="p-2">{r.building?.name}</td>
                  <td className="p-2">{fmtUGX(r.expected)}</td>
                  <td className="p-2">{fmtUGX(r.collected)}</td>
                  <td className="p-2">{fmtUGX(r.arrears)}</td>
                  <td className="p-2">{r.monthsOccupied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ura' && (
        <div className="space-y-4">
          <select className={`${inputCls} max-w-xs`} value={fyIndex} onChange={(e) => setFyIndex(Number(e.target.value))}>
            {fyOptions.map((fy, i) => <option key={`fy-${fy.label}`} value={i}>{fy.label}</option>)}
          </select>
          <div className="card table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Building</th>
                  <th className="p-2">Units</th>
                  <th className="p-2">Annual Rent Collected</th>
                  <th className="p-2">Avg Monthly</th>
                </tr>
              </thead>
              <tbody>
                {uraReport.rows.map((r) => (
                  <tr key={`ura-${r.building.id}`} className="border-b dark:border-gray-700">
                    <td className="p-2">{r.building.name}<br /><span className="text-xs text-gray-500">{r.building.address}</span></td>
                    <td className="p-2">{r.unitCount}</td>
                    <td className="p-2">{fmtUGX(r.annual)}</td>
                    <td className="p-2">{fmtUGX(r.avgMonthly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard label="Total Rental Income" value={fmtUGX(uraReport.total)} />
            <StatCard label="Estimated Tax (20% above UGX 2.82M)" value={fmtUGX(uraReport.taxEstimate)} color="#e07b00" />
          </div>
          <p className="text-sm text-gray-500">This is an estimate only. Please verify with a certified accountant before URA filing. Save this report for your URA return filing.</p>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => exportCSV('ura-rental-income.csv', ['Building', 'Units', 'Annual Income'], uraReport.rows.map((r) => [r.building.name, r.unitCount, r.annual]))}
          >
            Export CSV
          </button>
        </div>
      )}

      {tab === 'profitability' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard label="Most Profitable Unit" value={`${profitability.best?.unit.unitNumber} — ${fmtUGX(profitability.best?.net)}`} />
            <StatCard label="Least Profitable Unit" value={`${profitability.worst?.unit.unitNumber} — ${fmtUGX(profitability.worst?.net)}`} color="#d62828" />
          </div>
          <div className="card table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Unit</th>
                  <th className="p-2">Rent Amount</th>
                  <th className="p-2">Months Occupied</th>
                  <th className="p-2">Rent Collected</th>
                  <th className="p-2">Maintenance Cost</th>
                  <th className="p-2">Net Revenue</th>
                  <th className="p-2">Profitability %</th>
                </tr>
              </thead>
              <tbody>
                {profitability.rows.map((r) => (
                  <tr key={`prof-${r.unit.id}`} className={`border-b dark:border-gray-700 ${r.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' : r.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <td className="p-2">{r.unit.unitNumber}</td>
                    <td className="p-2">{fmtUGX(r.unit.monthlyRent)}</td>
                    <td className="p-2">{r.monthsOccupied}</td>
                    <td className="p-2">{fmtUGX(r.rentCollected)}</td>
                    <td className="p-2">{fmtUGX(r.maintCost)}</td>
                    <td className="p-2">{fmtUGX(r.net)}</td>
                    <td className="p-2">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export function DocumentsPage({ settings, setSettings }) {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">House Rules</h2>
        <textarea
          className={`${inputCls} min-h-[120px]`}
          value={settings.houseRulesText || ''}
          onChange={(e) => setSettings((s) => ({ ...s, houseRulesText: e.target.value }))}
          placeholder="Type house rules directly…"
        />
        <button
          type="button"
          className={btnSecondary}
          onClick={() => downloadText('house-rules.txt', settings.houseRulesText || '')}
        >
          Download House Rules
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Standard Lease Template</h2>
        <p className="text-sm text-gray-500">Upload a lease template PDF or use the text version below.</p>
        <textarea
          className={`${inputCls} min-h-[100px]`}
          value={settings.leaseTemplateText || 'Standard tenancy agreement for RentTrack Uganda properties.'}
          onChange={(e) => setSettings((s) => ({ ...s, leaseTemplateText: e.target.value }))}
        />
        <button
          type="button"
          className={btnSecondary}
          onClick={() => downloadText('lease-template.txt', settings.leaseTemplateText || '')}
        >
          Download Lease Template
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Landlord and Tenant Act 2019 Summary</h2>
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded">{LTA_SUMMARY}</pre>
        <button type="button" className={btnSecondary} onClick={() => downloadText('lta-2019-summary.txt', LTA_SUMMARY)}>
          Download Summary
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!settings.autoSendDocs}
          onChange={(e) => setSettings((s) => ({ ...s, autoSendDocs: e.target.checked }))}
        />
        Send House Rules + Act summary to new tenants
      </label>
    </div>
  )
}

export function LegalNoticesPage({
  tenants,
  payments,
  units,
  buildings,
  notices,
  setNotices,
  settings,
  showToast,
  currentUser,
}) {
  const [noticeTab, setNoticeTab] = useState('warning')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [newRent, setNewRent] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [manualNotice, setManualNotice] = useState({ tenantId: '', type: 'Warning Letter', servedBy: 'Admin' })

  const tenant = lookupTenant(tenants, selectedTenant)
  const unit = lookupUnit(units, tenant?.unitId)
  const building = lookupBuilding(buildings, tenant?.buildingId)
  const bal = tenant ? getTenantBalance(tenant.id, tenants, payments) : null

  const warningLetter = tenant ? `WARNING NOTICE — LATE PAYMENT
Date: ${fmtDate(new Date())}

To: ${tenant.firstName} ${tenant.lastName}
Unit ${unit?.unitNumber}, ${building?.name}, ${building?.address}

Dear ${tenant.firstName},

This notice is issued under Section 31 of the Landlord and Tenant Act 2019 (Uganda).

As at ${fmtDate(new Date())}, your rent account shows an outstanding balance of ${fmtUGX(bal?.balance)} covering arrears.
Despite previous reminders, payment has not been received.

You are required to settle the full outstanding amount of ${fmtUGX(bal?.balance)} within 7 days of this notice.

Failure to do so will result in:
(1) Late fees as per your lease agreement
(2) Referral to the Local Council (LC1)
(3) Legal proceedings for eviction and recovery of arrears

Signed: ${settings.managerName || '_______________________'}
Date: ${fmtDate(new Date())}` : ''

  const lc1Notice = tenant ? `NOTICE TO LC1 CHAIRMAN — EVICTION REFERRAL
Date: ${fmtDate(new Date())}

To: The Chairman, Local Council One (LC1)
${building?.address}

Re: ${tenant.firstName} ${tenant.lastName} — Unit ${unit?.unitNumber}, ${building?.name}

Dear Chairman,

We refer to the tenancy of the above-named tenant who occupies Unit ${unit?.unitNumber} at ${building?.name}.

Outstanding rent arrears: ${fmtUGX(bal?.balance)}
Days late: ${bal?.daysLate}

Previous notices have been served without resolution. We request your office's assistance in mediating this matter.

Signed: ${settings.managerName || 'Property Manager'}
${settings.companyName}` : ''

  const daysToEffective = effectiveDate ? daysBetween(new Date(), effectiveDate) : 0
  const rentIncreaseWarning = effectiveDate && daysToEffective < 60

  const rentIncreaseLetter = tenant && newRent ? `RENT INCREASE NOTICE
Date: ${fmtDate(new Date())}

To: ${tenant.firstName} ${tenant.lastName}
Unit ${unit?.unitNumber}, ${building?.name}

Dear ${tenant.firstName},

Pursuant to the Landlord and Tenant Act 2019 (Uganda), you are hereby notified of a rent adjustment:

Current rent: ${fmtUGX(tenant.rentAmount)}
New rent: ${fmtUGX(Number(newRent))}
Effective date: ${fmtDate(effectiveDate)}

This notice is given in accordance with the 2-month advance notice requirement.

Signed: ${settings.managerName || '_______________________'}
Date: ${fmtDate(new Date())}` : ''

  const logNotice = (type, tenantId) => {
    const t = lookupTenant(tenants, tenantId)
    setNotices((prev) => [
      ...prev,
      {
        id: `n-${Date.now()}`,
        tenantId,
        unitId: t?.unitId,
        buildingId: t?.buildingId,
        type,
        date: new Date().toISOString().split('T')[0],
        servedBy: currentUser?.name || 'Admin',
        followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      },
    ])
    showToast('Notice logged', 'success')
  }

  const addManualNotice = () => {
    if (!manualNotice.tenantId) return
    logNotice(manualNotice.type, manualNotice.tenantId)
    setManualNotice({ tenantId: '', type: 'Warning Letter', servedBy: 'Admin' })
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Legal Notices</h1>

      <div className="flex flex-wrap gap-2">
        {['warning', 'lc1', 'increase'].map((t) => (
          <button
            key={`legal-tab-${t}`}
            type="button"
            className={`px-3 py-1.5 rounded text-sm ${noticeTab === t ? 'bg-[#2d6a4f] text-white' : 'border'}`}
            onClick={() => setNoticeTab(t)}
          >
            {t === 'warning' ? 'Warning Letter' : t === 'lc1' ? 'LC1 Notice' : 'Rent Increase'}
          </button>
        ))}
      </div>

      <select className={`${inputCls} max-w-md`} value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
        <option value="">Select tenant…</option>
        {tenants.filter((t) => t.status !== 'Departed').map((t) => (
          <option key={`legal-tenant-${t.id}`} value={t.id}>{t.firstName} {t.lastName}</option>
        ))}
      </select>

      {noticeTab === 'warning' && tenant && (
        <div className="card p-4 space-y-4">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded max-h-96 overflow-y-auto">{warningLetter}</pre>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className={btnSecondary} onClick={() => downloadText(`warning-${tenant.id}.txt`, warningLetter)}>Download</button>
            <button type="button" className={btnPrimary} onClick={() => logNotice('Warning Letter', tenant.id)}>Log Notice</button>
          </div>
        </div>
      )}

      {noticeTab === 'lc1' && tenant && (
        <div className="card p-4 space-y-4">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded max-h-96 overflow-y-auto">{lc1Notice}</pre>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className={btnSecondary} onClick={() => downloadText(`lc1-${tenant.id}.txt`, lc1Notice)}>Download</button>
            <button type="button" className={btnPrimary} onClick={() => logNotice('LC1 Notice', tenant.id)}>Log Notice</button>
          </div>
        </div>
      )}

      {noticeTab === 'increase' && (
        <div className="card p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">New Rent (UGX)</label>
              <input type="number" className={inputCls} value={newRent} onChange={(e) => setNewRent(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Effective Date</label>
              <input type="date" className={inputCls} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
          </div>
          {rentIncreaseWarning && (
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-800 rounded text-sm">
              Landlord and Tenant Act 2019 requires 2 months advance notice. Please adjust the effective date.
            </div>
          )}
          {tenant && newRent && effectiveDate && (
            <>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded">{rentIncreaseLetter}</pre>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={btnSecondary} onClick={() => downloadText(`rent-increase-${tenant.id}.txt`, rentIncreaseLetter)}>Download</button>
                <button type="button" className={btnPrimary} onClick={() => logNotice('Rent Increase Notice', tenant.id)}>Log Notice</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card p-4">
        <h2 className="font-semibold mb-4">Notice Tracker</h2>
        <div className="grid sm:grid-cols-3 gap-2 mb-4">
          <select className={inputCls} value={manualNotice.tenantId} onChange={(e) => setManualNotice((m) => ({ ...m, tenantId: e.target.value }))}>
            <option value="">Add notice — select tenant…</option>
            {tenants.map((t) => <option key={`man-tenant-${t.id}`} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
          <select className={inputCls} value={manualNotice.type} onChange={(e) => setManualNotice((m) => ({ ...m, type: e.target.value }))}>
            <option>Warning Letter</option>
            <option>LC1 Notice</option>
            <option>Rent Increase Notice</option>
            <option>Other</option>
          </select>
          <button type="button" className={btnPrimary} onClick={addManualNotice}>Add Notice</button>
        </div>
        {notices.length === 0 ? (
          <EmptyState message="No notices served yet." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Notice Type</th>
                  <th className="p-2">Served By</th>
                  <th className="p-2">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => {
                  const t = lookupTenant(tenants, n.tenantId)
                  const u = lookupUnit(units, n.unitId)
                  return (
                    <tr key={`notice-track-${n.id}`} className="border-b dark:border-gray-700">
                      <td className="p-2">{fmtDate(n.date)}</td>
                      <td className="p-2">{t ? `${t.firstName} ${t.lastName}` : '—'}</td>
                      <td className="p-2">{u?.unitNumber}</td>
                      <td className="p-2">{n.type}</td>
                      <td className="p-2">{n.servedBy}</td>
                      <td className="p-2">{fmtDate(n.followUpDate)}</td>
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

export function SettingsPage({ settings, setSettings, showToast, onRestartTour }) {
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [testing, setTesting] = useState(false)

  const testConnection = () => {
    setTesting(true)
    setTimeout(() => {
      setConnectionStatus(settings.africasTalkingKey ? 'Connected' : 'Not Connected')
      showToast(
        settings.africasTalkingKey
          ? 'Connection settings saved. In production, this connects to AfricasTalking.'
          : 'Add API key to connect',
        'info',
      )
      setTesting(false)
    }, 600)
  }

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setSettings((s) => ({ ...s, logoDataUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const restartTour = () => {
    safeSet('renttrack_tour_seen', false)
    onRestartTour?.()
    showToast('Onboarding tour will show on next navigation', 'success')
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Section 1: Building Defaults</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Late Fee Type</label>
            <select className={inputCls} value={settings.lateFeeType} onChange={(e) => setSettings((s) => ({ ...s, lateFeeType: e.target.value }))}>
              <option>Flat Amount</option>
              <option>Percentage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Late Fee Value</label>
            <input type="number" className={inputCls} value={settings.lateFeeValue} onChange={(e) => setSettings((s) => ({ ...s, lateFeeValue: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Grace Period (days)</label>
            <input type="number" className={inputCls} value={settings.gracePeriod} onChange={(e) => setSettings((s) => ({ ...s, gracePeriod: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Default Rent Due Day</label>
            <input type="number" className={inputCls} min="1" max="28" value={settings.rentDueDay} onChange={(e) => setSettings((s) => ({ ...s, rentDueDay: Number(e.target.value) }))} />
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Section 2: SMS/WhatsApp Setup</h2>
        <div>
          <label className="block text-sm mb-1">AfricasTalking API Key</label>
          <input type="password" className={inputCls} value={settings.africasTalkingKey} onChange={(e) => setSettings((s) => ({ ...s, africasTalkingKey: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Sender ID</label>
          <input className={inputCls} value={settings.senderId} onChange={(e) => setSettings((s) => ({ ...s, senderId: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">WhatsApp Business Number</label>
          <input className={inputCls} value={settings.whatsappNumber} onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))} />
        </div>
        <LoadingButton loading={testing} className={btnSecondary} onClick={testConnection}>Test Connection</LoadingButton>
        {connectionStatus && <Badge color={connectionStatus === 'Connected' ? 'green' : 'red'}>{connectionStatus}</Badge>}
        <p className="text-xs text-gray-500">Contact AfricasTalking at africastalking.com for API keys</p>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Section 3: PDF Branding</h2>
        <div>
          <label className="block text-sm mb-1">Building Logo</label>
          <input type="file" accept="image/*" onChange={handleLogo} />
          {settings.logoDataUrl && <img src={settings.logoDataUrl} alt="Logo preview" className="mt-2 h-16 object-contain" />}
        </div>
        <div>
          <label className="block text-sm mb-1">Manager / Owner Name</label>
          <input className={inputCls} value={settings.managerName} onChange={(e) => setSettings((s) => ({ ...s, managerName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Official Stamp Text</label>
          <input className={inputCls} value={settings.stampText} onChange={(e) => setSettings((s) => ({ ...s, stampText: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Company / Property Name</label>
          <input className={inputCls} value={settings.companyName} onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))} />
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Section 4: Language Defaults</h2>
        <select className={inputCls} value={settings.defaultLanguage} onChange={(e) => setSettings((s) => ({ ...s, defaultLanguage: e.target.value }))}>
          <option>English</option>
          <option>Luganda</option>
        </select>
        <p className="text-xs text-gray-500">Per-tenant override is set in Tenant Profile.</p>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="font-semibold">Section 5: MoMo Payment Numbers</h2>
        <div>
          <label className="block text-sm mb-1">MTN MoMo Number</label>
          <input className={inputCls} value={settings.mtnMomo} onChange={(e) => setSettings((s) => ({ ...s, mtnMomo: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Airtel Money Number</label>
          <input className={inputCls} value={settings.airtelMoney} onChange={(e) => setSettings((s) => ({ ...s, airtelMoney: e.target.value }))} />
        </div>
        <p className="text-xs text-gray-500">These appear in all reminder messages automatically.</p>
      </div>

      <button type="button" className={btnSecondary} onClick={restartTour}>Restart Tour</button>
    </div>
  )
}

export function BlacklistReportPage({ tenants, setTenants, units, showToast }) {
  const blacklisted = tenants.filter((t) => t.blacklisted)

  const removeBlacklist = (tenant) => {
    if (!window.confirm(`Remove ${tenant.firstName} ${tenant.lastName} from blacklist?`)) return
    setTenants((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, blacklisted: false, blacklistReason: '' } : t)),
    )
    showToast('Tenant removed from blacklist', 'success')
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Blacklist Report</h1>
      {blacklisted.length === 0 ? (
        <EmptyState message="No blacklisted tenants." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blacklisted.map((t) => {
                const unit = lookupUnit(units, t.unitId)
                return (
                  <tr key={`bl-${t.id}`} className="border-b dark:border-gray-700">
                    <td className="p-2">{t.firstName} {t.lastName}</td>
                    <td className="p-2">{unit?.unitNumber || '—'}</td>
                    <td className="p-2">{t.blacklistReason || '—'}</td>
                    <td className="p-2"><Badge color="darkred">Blacklisted</Badge></td>
                    <td className="p-2">
                      <button type="button" className="text-sm text-[#2d6a4f]" onClick={() => removeBlacklist(t)}>Remove from Blacklist</button>
                    </td>
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

export function DefaulterListPage({ tenants, payments, units, buildings }) {
  const rows = useMemo(() =>
    tenants
      .filter((t) => t.status !== 'Departed')
      .map((t) => {
        const bal = getTenantBalance(t.id, tenants, payments)
        const unit = lookupUnit(units, t.unitId)
        const building = lookupBuilding(buildings, t.buildingId)
        return { tenant: t, unit, building, bal }
      })
      .filter((r) => r.bal.balance > 0)
      .sort((a, b) => b.bal.balance - a.bal.balance),
  [tenants, payments, units, buildings])

  const exportList = () => {
    exportCSV('defaulter-list.csv', ['Tenant', 'Unit', 'Building', 'Balance', 'Days Late', 'Phone', 'Guarantor', 'Guarantor Phone'], rows.map((r) => [
      `${r.tenant.firstName} ${r.tenant.lastName}`,
      r.unit?.unitNumber,
      r.building?.name,
      r.bal.balance,
      r.bal.daysLate,
      r.tenant.phone,
      r.tenant.guarantorName,
      r.tenant.guarantorPhone,
    ]))
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">Defaulter List</h1>
        <button type="button" className={btnSecondary} onClick={exportList}>Export CSV</button>
      </div>
      {rows.length === 0 ? (
        <EmptyState message="No defaulters — all tenants are up to date." />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left">
                <th className="p-2">Tenant</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Building</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Days Late</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Guarantor Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`deflist-${r.tenant.id}`} className={`border-b dark:border-gray-700 ${getRowColor(r.bal.daysLate)}`}>
                  <td className="p-2">{r.tenant.firstName} {r.tenant.lastName}</td>
                  <td className="p-2">{r.unit?.unitNumber}</td>
                  <td className="p-2">{r.building?.name}</td>
                  <td className="p-2 font-semibold">{fmtUGX(r.bal.balance)}</td>
                  <td className="p-2">{r.bal.daysLate}</td>
                  <td className="p-2">{r.tenant.phone}</td>
                  <td className="p-2">
                    {r.tenant.guarantorName}<br />
                    <span className="text-xs text-gray-500">{r.tenant.guarantorPhone}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
