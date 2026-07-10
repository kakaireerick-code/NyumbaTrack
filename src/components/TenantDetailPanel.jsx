import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  fmtUGX,
  fmtDate,
  getTenantBalance,
  getInitials,
  daysUntilLeaseEnd,
  downloadText,
} from '../utils/helpers'
import { Badge, LoadingButton } from './UI'

const TABS = ['Profile', 'Lease', 'Payments', 'Balance', 'Documents', 'Notes']

const BLACKLIST_REASONS = [
  'Non-payment',
  'Property damage',
  'Noise complaints',
  'Lease violation',
  'Other',
]

const DOCUMENT_TYPES = [
  { key: 'lease', label: 'Lease Agreement', urlKey: 'leaseUrl' },
  { key: 'id', label: 'National ID Photo', urlKey: 'idPhotoUrl' },
  { key: 'receipt', label: 'Latest Receipt', urlKey: null },
  { key: 'notice', label: 'Legal Notices', urlKey: null },
]

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-xl leading-none ${star <= (value || 0) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function buildWarningLetter(tenant, unit, building, settings, balanceInfo) {
  const today = new Date()
  const deadline = new Date(today)
  deadline.setDate(deadline.getDate() + 30)
  const tenantName = `${tenant?.firstName || ''} ${tenant?.lastName || ''}`.trim()
  const landlord = settings?.managerName || settings?.companyName || 'Property Manager'
  const company = settings?.companyName || 'RentTrack Uganda'

  return `${company}
${building?.address || ''}
Date: ${fmtDate(today.toISOString())}

FORMAL WARNING LETTER — RENT ARREARS
(Pursuant to the Landlord and Tenant Act, 2019)

To: ${tenantName}
Tenant of Unit ${unit?.unitNumber || '—'}, ${building?.name || ''}
Phone: ${tenant?.phone || '—'}
NIN: ${tenant?.nin || '—'}

Dear ${tenant?.firstName || 'Tenant'},

RE: NOTICE OF DEFAULT IN PAYMENT OF RENT — Section 29, Landlord and Tenant Act, 2019

We write to formally notify you that you are in breach of your tenancy agreement dated ${fmtDate(tenant?.leaseStart)} for the premises at Unit ${unit?.unitNumber || '—'}, ${building?.name || ''}, ${building?.address || ''}.

PARTICULARS OF DEFAULT
- Monthly rent: ${fmtUGX(tenant?.rentAmount)}
- Total rent due to date: ${fmtUGX(balanceInfo?.totalDue)}
- Total paid to date: ${fmtUGX(balanceInfo?.totalPaid)}
- Outstanding balance: ${fmtUGX(balanceInfo?.balance)}
- Days in arrears: ${balanceInfo?.daysLate || 0}

In accordance with Section 29 of the Landlord and Tenant Act, 2019, where a tenant defaults in paying rent and is in arrears, the landlord may apply to a court of competent jurisdiction to recover the rent owed. Where the default continues for more than thirty (30) days, the landlord shall be entitled to re-enter the premises and take possession in the presence of an area local council official and the police, without prejudice to the right to recover rent arrears.

REQUIRED ACTION
You are hereby required to pay the full outstanding amount of ${fmtUGX(balanceInfo?.balance)} within THIRTY (30) DAYS from the date of this notice, being on or before ${fmtDate(deadline.toISOString())}.

Payment may be made via:
- MTN MoMo: ${settings?.mtnMomo || '—'}
- Airtel Money: ${settings?.airtelMoney || '—'}
Reference: Unit ${unit?.unitNumber || '—'}

FAILURE TO COMPLY
If payment is not received within the stipulated period, we shall proceed to:
1. Contact your guarantor (${tenant?.guarantorName || '—'}, ${tenant?.guarantorPhone || '—'});
2. Initiate legal proceedings for recovery of rent arrears under the Landlord and Tenant Act, 2019;
3. Exercise our right of re-entry as provided under Section 29(2) of the Act, in the presence of the police and an area local council official.

This notice is served without prejudice to any other rights and remedies available to the landlord under the tenancy agreement and the laws of Uganda.

Yours faithfully,

${landlord}
${company}
${settings?.stampText || ''}

---
Served on: ${fmtDate(today.toISOString())}
Unit: ${unit?.unitNumber || '—'} | Building: ${building?.name || '—'}
`
}

function buildEvictionNotice(tenant, unit, building, settings, balanceInfo) {
  const today = new Date()
  const vacateDate = new Date(today)
  vacateDate.setDate(vacateDate.getDate() + 30)
  const tenantName = `${tenant?.firstName || ''} ${tenant?.lastName || ''}`.trim()
  const landlord = settings?.managerName || settings?.companyName || 'Property Manager'
  const company = settings?.companyName || 'RentTrack Uganda'

  return `${company}
${building?.address || ''}
Date: ${fmtDate(today.toISOString())}

NOTICE OF TERMINATION OF TENANCY AND INTENTION TO RE-ENTER
(Landlord and Tenant Act, 2019 — Section 29)

To: ${tenantName}
Tenant of Unit ${unit?.unitNumber || '—'}, ${building?.name || ''}
Phone: ${tenant?.phone || '—'}

Dear ${tenant?.firstName || 'Tenant'},

RE: NOTICE TO VACATE PREMISES

Following our previous warning(s) regarding non-payment of rent, and pursuant to Section 29 of the Landlord and Tenant Act, 2019, we hereby give you formal notice to vacate the premises at:

Unit ${unit?.unitNumber || '—'}, ${building?.name || ''}
${building?.address || ''}

OUTSTANDING AMOUNTS
- Rent arrears: ${fmtUGX(balanceInfo?.balance)}
- Monthly rent: ${fmtUGX(tenant?.rentAmount)}
- Days in arrears: ${balanceInfo?.daysLate || 0}

NOTICE PERIOD
You are required to vacate the premises and hand over peaceful possession on or before ${fmtDate(vacateDate.toISOString())} (30 days from the date of this notice).

If you fail to vacate by the date specified, the landlord shall be entitled to re-enter the premises and take possession in the presence of an area local council official and the police, as provided under Section 29(2) of the Landlord and Tenant Act, 2019.

All outstanding rent arrears remain payable and may be recovered through a court of competent jurisdiction.

Contact for queries: ${building?.caretakerPhone || settings?.whatsappNumber || '—'}

Yours faithfully,

${landlord}
${company}
${settings?.stampText || ''}
`
}

function buildReceiptText(tenant, unit, building, settings, payment, balance) {
  const latest = payment || {}
  return `=====================================
OFFICIAL RENT RECEIPT
${settings?.companyName || building?.name || 'RentTrack Uganda'}
${building?.address || ''}
=====================================

Receipt No: ${latest?.receiptNo || 'N/A'}
Date: ${fmtDate(latest?.date || new Date().toISOString())}

Received from: ${tenant?.firstName || ''} ${tenant?.lastName || ''}
Unit: ${unit?.unitNumber || ''}
Period: ${latest?.period || '—'}

Amount Received: ${fmtUGX(latest?.amount || 0)}
Payment Method: ${latest?.method || '—'}
Reference: ${latest?.reference || '—'}

Running Balance: ${fmtUGX(balance)}
${balance <= 0 ? '(FULLY PAID)' : ''}

Issued by: ${settings?.managerName || 'Property Manager'}
${settings?.stampText || ''}
=====================================`
}

export default function TenantDetailPanel({
  tenant,
  unit,
  building,
  payments = [],
  settings = {},
  currentUser,
  onClose,
  onRecordPayment,
  onSendReminder,
  onMarkDeparted,
  onUpdateTenant,
  onAddNote,
  onAttachAgreement,
  tenantNotes = {},
  utilities = [],
  showFinancial = true,
}) {
  const [activeTab, setActiveTab] = useState('Profile')
  const [noteText, setNoteText] = useState('')
  const [blacklistReason, setBlacklistReason] = useState(tenant?.blacklistReason || '')
  const [loadingAction, setLoadingAction] = useState(null)

  const balanceInfo = useMemo(
    () => getTenantBalance(tenant?.id, tenant ? [tenant] : [], payments),
    [tenant, payments],
  )

  const daysLeft = daysUntilLeaseEnd(tenant?.leaseEnd)
  const leaseExpiringSoon = daysLeft < 60

  const visibleTabs = useMemo(
    () => (showFinancial ? TABS : TABS.filter((t) => t !== 'Payments' && t !== 'Balance')),
    [showFinancial],
  )

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(a?.date) - new Date(b?.date)),
    [payments],
  )

  const paymentsWithRunningBalance = useMemo(() => {
    let cumulativePaid = 0
    return sortedPayments.map((p) => {
      cumulativePaid += p?.amount || 0
      const running = (balanceInfo?.totalDue || 0) - cumulativePaid
      return { ...p, runningBalance: running }
    })
  }, [sortedPayments, balanceInfo?.totalDue])

  const monthUtilities = useMemo(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    return utilities.filter(
      (u) =>
        u?.unitId === unit?.id &&
        u?.month === month &&
        u?.year === year,
    )
  }, [utilities, unit?.id])

  const utilitiesTotal = monthUtilities.reduce((sum, u) => sum + (u?.amount || 0), 0)
  const totalDueWithUtilities = (balanceInfo?.balance || 0) + utilitiesTotal

  const depositStatus = useMemo(() => {
    const paid = tenant?.depositPaid || 0
    const required = tenant?.depositAmount || 0
    if (required <= 0) return { label: 'N/A', color: 'gray' }
    if (paid >= required) return { label: 'Paid in Full', color: 'green' }
    if (paid > 0) return { label: 'Partial', color: 'orange' }
    return { label: 'Unpaid', color: 'red' }
  }, [tenant?.depositPaid, tenant?.depositAmount])

  const notesList = tenantNotes?.[tenant?.id] || []
  const langBadge = tenant?.preferredLanguage === 'Luganda' ? 'LG' : 'EN'
  const latestPayment = [...payments].sort((a, b) => new Date(b?.date) - new Date(a?.date))[0]

  const handleUpdate = (updates) => {
    onUpdateTenant?.(tenant?.id, updates)
  }

  const handleBlacklistToggle = (checked) => {
    handleUpdate({
      blacklisted: checked,
      blacklistReason: checked ? blacklistReason || BLACKLIST_REASONS[0] : '',
    })
  }

  const handleDownload = (filename, content) => {
    setLoadingAction(filename)
    downloadText(filename, content)
    setTimeout(() => setLoadingAction(null), 500)
  }

  const handleSaveNote = () => {
    if (!noteText?.trim()) return
    onAddNote?.(tenant?.id, {
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
      author: currentUser?.name || currentUser?.role || 'Staff',
    })
    setNoteText('')
  }

  if (!tenant) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        className="relative w-full max-w-lg h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Tenant details"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {getInitials(tenant?.firstName, tenant?.lastName)}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold truncate">
                {tenant?.firstName} {tenant?.lastName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Unit {unit?.unitNumber || '—'} · {building?.name || '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b dark:border-gray-700 shrink-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#2d6a4f] text-[#2d6a4f] font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'Profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#2d6a4f] text-white flex items-center justify-center text-xl font-bold">
                  {getInitials(tenant?.firstName, tenant?.lastName)}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {tenant?.firstName} {tenant?.lastName}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge color={tenant?.status === 'Active' ? 'green' : tenant?.status === 'Defaulter' ? 'red' : 'orange'}>
                      {tenant?.status || '—'}
                    </Badge>
                    <Badge color="blue">{langBadge}</Badge>
                    {tenant?.blacklisted && <Badge color="darkred">Blacklisted</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">NIN</span>
                  <span>{tenant?.nin || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">Phone</span>
                  <a href={`tel:${tenant?.phone}`} className="text-[#2d6a4f]">{tenant?.phone || '—'}</a>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">Email</span>
                  <span>{tenant?.email || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">WhatsApp</span>
                  <span>{tenant?.whatsapp || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">Guarantor</span>
                  <span className="text-right">
                    {tenant?.guarantorName || '—'}
                    {tenant?.guarantorPhone && (
                      <span className="block text-xs text-gray-500">{tenant.guarantorPhone}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-500">Unit / Building</span>
                  <span>{unit?.unitNumber || '—'} / {building?.name || '—'}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Tenant Rating</p>
                <StarRating
                  value={tenant?.rating}
                  onChange={(rating) => handleUpdate({ rating })}
                />
              </div>

              <div className="card p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!tenant?.blacklisted}
                    onChange={(e) => handleBlacklistToggle(e.target.checked)}
                    className="rounded"
                  />
                  Blacklist Tenant
                </label>
                {tenant?.blacklisted && (
                  <select
                    value={blacklistReason || tenant?.blacklistReason || BLACKLIST_REASONS[0]}
                    onChange={(e) => {
                      setBlacklistReason(e.target.value)
                      handleUpdate({ blacklistReason: e.target.value })
                    }}
                    className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                  >
                    {BLACKLIST_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Lease' && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-500">Lease Start</span>
                <span>{fmtDate(tenant?.leaseStart)}</span>
              </div>
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-500">Lease End</span>
                <span>{fmtDate(tenant?.leaseEnd)}</span>
              </div>
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-500">Days Until Expiry</span>
                <span className={leaseExpiringSoon ? 'text-red-600 font-semibold' : ''}>
                  {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                </span>
              </div>
              {showFinancial && (
                <>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-gray-500">Monthly Rent</span>
                    <span className="font-medium">{fmtUGX(tenant?.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-gray-500">Security Deposit</span>
                    <span>{fmtUGX(tenant?.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-gray-500">Deposit Paid</span>
                    <span>{fmtUGX(tenant?.depositPaid)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-2 items-center">
                <span className="text-gray-500">Deposit Status</span>
                <Badge color={depositStatus.color}>{depositStatus.label}</Badge>
              </div>
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="text-gray-500">Rent Due Day</span>
                <span>{tenant?.rentDueDay ? `${tenant.rentDueDay}th of month` : '—'}</span>
              </div>
            </div>
          )}

          {activeTab === 'Payments' && showFinancial && (
            <div className="space-y-3">
              <div className={`card p-3 ${balanceInfo?.balance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                <p className="text-sm text-gray-500">Running Balance</p>
                <p className={`text-xl font-bold ${balanceInfo?.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmtUGX(balanceInfo?.balance)}
                </p>
                {balanceInfo?.daysLate > 0 && (
                  <p className="text-xs text-red-600 mt-1">{balanceInfo.daysLate} days late</p>
                )}
              </div>

              {paymentsWithRunningBalance.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No payments recorded</p>
              ) : (
                <div className="table-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                        <th className="py-2 pr-2">Date</th>
                        <th className="py-2 pr-2">Amount</th>
                        <th className="py-2 pr-2">Type</th>
                        <th className="py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...paymentsWithRunningBalance].reverse().map((p) => (
                        <tr key={p?.id} className="border-b dark:border-gray-700">
                          <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(p?.date)}</td>
                          <td className="py-2 pr-2">{fmtUGX(p?.amount)}</td>
                          <td className="py-2 pr-2 capitalize">{p?.type || '—'}</td>
                          <td className={`py-2 ${p?.runningBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {fmtUGX(p?.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Balance' && showFinancial && (
            <div className="space-y-3 text-sm">
              <div className="card p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected (Rent to Date)</span>
                  <span>{fmtUGX(balanceInfo?.totalDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid to Date</span>
                  <span className="text-green-600">{fmtUGX(balanceInfo?.totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t dark:border-gray-700 pt-2">
                  <span className="text-gray-500">Rent Balance</span>
                  <span className={balanceInfo?.balance > 0 ? 'text-red-600 font-medium' : ''}>
                    {fmtUGX(balanceInfo?.balance)}
                  </span>
                </div>
              </div>

              <div className="card p-3">
                <p className="font-medium mb-2">Utilities This Month</p>
                {monthUtilities.length === 0 ? (
                  <p className="text-gray-500 text-xs">No utility charges this month</p>
                ) : (
                  <ul className="space-y-1">
                    {monthUtilities.map((u) => (
                      <li key={u?.id} className="flex justify-between">
                        <span>{u?.type || 'Utility'}{u?.notes ? ` — ${u.notes}` : ''}</span>
                        <span>{fmtUGX(u?.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between border-t dark:border-gray-700 mt-2 pt-2">
                  <span className="text-gray-500">Utilities Subtotal</span>
                  <span>{fmtUGX(utilitiesTotal)}</span>
                </div>
              </div>

              <div className="card p-3 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between text-base font-bold">
                  <span>Total Due</span>
                  <span className={totalDueWithUtilities > 0 ? 'text-red-600' : 'text-green-600'}>
                    {fmtUGX(totalDueWithUtilities)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="space-y-3">
              <div className="card p-3 flex items-center justify-between gap-2 border-l-4 border-[#2d6a4f]">
                <div>
                  <p className="font-medium text-sm">Tenancy agreement (PDF)</p>
                  <p className="text-xs text-gray-500">
                    {tenant?.agreementPdf ? String(tenant.agreementPdf.fileName) : 'No PDF attached'}
                    {tenant?.shareAgreementWithTenant && tenant?.agreementPdf && (
                      <span className="ml-2"><Badge color="green">Shared with tenant</Badge></span>
                    )}
                  </p>
                  {tenant?.importSourcePath && (
                    <p className="text-xs text-orange-600 mt-1">
                      <Badge color="orange">Owner only</Badge> Imported from {String(tenant.importSourcePath)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onAttachAgreement}
                  className="px-3 py-1.5 text-xs bg-[#2d6a4f] text-white rounded shrink-0"
                >
                  {tenant?.agreementPdf ? 'Update' : 'Attach'} agreement
                </button>
              </div>
              {tenant?.agreementPdf?.dataUrl && (
                <a
                  href={tenant.agreementPdf.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#2d6a4f] underline"
                >
                  Open agreement PDF
                </a>
              )}

              {DOCUMENT_TYPES.map((doc) => {
                const url = doc.urlKey ? tenant?.[doc.urlKey] : null
                const hasFile = !!url
                return (
                  <div key={doc.key} className="card p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{doc.label}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {hasFile ? 'File on record' : 'No file uploaded'}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <label className="px-3 py-1.5 text-xs border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        Upload
                        <input type="file" className="hidden" disabled />
                      </label>
                      {hasFile && (
                        <LoadingButton
                          loading={loadingAction === `${doc.key}-dl`}
                          className="px-3 py-1.5 text-xs bg-[#2d6a4f] text-white rounded"
                          onClick={() => handleDownload(`${doc.key}-${tenant?.id}.txt`, `${doc.label} for ${tenant?.firstName} ${tenant?.lastName}\nUnit: ${unit?.unitNumber}\nURL: ${url}`)}
                        >
                          Download
                        </LoadingButton>
                      )}
                    </div>
                  </div>
                )
              })}

              {latestPayment?.receiptNo && showFinancial && (
                <div className="card p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">Payment Receipt</p>
                    <p className="text-xs text-gray-500">{latestPayment.receiptNo}</p>
                  </div>
                  <LoadingButton
                    loading={loadingAction === 'receipt-dl'}
                    className="px-3 py-1.5 text-xs bg-[#2d6a4f] text-white rounded"
                    onClick={() =>
                      handleDownload(
                        `receipt-${latestPayment.receiptNo}.txt`,
                        buildReceiptText(tenant, unit, building, settings, latestPayment, balanceInfo?.balance),
                      )
                    }
                  >
                    Download
                  </LoadingButton>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="space-y-4">
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this tenant..."
                  rows={4}
                  className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                />
                <LoadingButton
                  loading={loadingAction === 'save-note'}
                  className="mt-2 px-4 py-2 bg-[#2d6a4f] text-white rounded text-sm"
                  onClick={() => {
                    setLoadingAction('save-note')
                    handleSaveNote()
                    setTimeout(() => setLoadingAction(null), 300)
                  }}
                >
                  Save Note
                </LoadingButton>
              </div>

              {notesList.length > 0 ? (
                <ul className="space-y-2">
                  {[...notesList].reverse().map((note, idx) => (
                    <li key={note?.id || idx} className="card p-3 text-sm">
                      <p>{note?.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {fmtDate(note?.timestamp)} · {note?.author || 'Staff'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center">No notes yet</p>
              )}

              {tenant?.notes && (
                <div className="card p-3 text-sm border-l-4 border-[#2d6a4f]">
                  <p className="text-xs text-gray-500 mb-1">Legacy Note</p>
                  <p>{tenant.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="border-t dark:border-gray-700 p-3 shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {showFinancial && (
              <button
                type="button"
                onClick={() => onRecordPayment?.(tenant)}
                className="px-3 py-2 text-sm bg-[#2d6a4f] text-white rounded hover:opacity-90"
              >
                Record Payment
              </button>
            )}
            <button
              type="button"
              onClick={() => onSendReminder?.(tenant)}
              className="px-3 py-2 text-sm bg-[#40916c] text-white rounded hover:opacity-90"
            >
              Send Reminder
            </button>
            {showFinancial && (
              <LoadingButton
                loading={loadingAction === 'receipt-gen'}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() =>
                  handleDownload(
                    `receipt-${tenant?.id}.txt`,
                    buildReceiptText(tenant, unit, building, settings, latestPayment, balanceInfo?.balance),
                  )
                }
              >
                Generate Receipt
              </LoadingButton>
            )}
            {showFinancial && (
              <LoadingButton
                loading={loadingAction === 'warning-letter'}
                className="px-3 py-2 text-sm border border-orange-300 text-orange-700 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() =>
                  handleDownload(
                    `warning-letter-${tenant?.id}.txt`,
                    buildWarningLetter(tenant, unit, building, settings, balanceInfo),
                  )
                }
              >
                Generate Warning Letter
              </LoadingButton>
            )}
            {showFinancial && (
              <LoadingButton
                loading={loadingAction === 'eviction-notice'}
                className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() =>
                  handleDownload(
                    `eviction-notice-${tenant?.id}.txt`,
                    buildEvictionNotice(tenant, unit, building, settings, balanceInfo),
                  )
                }
              >
                Generate Eviction Notice
              </LoadingButton>
            )}
            {showFinancial && (
            <button
              type="button"
              onClick={() => onMarkDeparted?.(tenant)}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:opacity-90 col-span-2"
            >
              Mark as Departed
            </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
