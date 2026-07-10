import React, { useState } from 'react'
import { formatDate, nextDueDate } from '../lib/dates'
import { computeArrears, formatCurrency } from '../lib/rentLedger'
import { getTenantSafeBuilding, getTenantSafeUnit, getTenantSafeTenantRecord } from '../lib/propertyViews'
import { Badge, EmptyState, LoadingButton } from '../components/UI'
import { buildReceiptData } from '../utils/receipts'
import ReceiptViewerModal from '../components/ReceiptViewerModal'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import { Smartphone, Copy, MessageCircle, Send } from 'lucide-react'
import {
  getThread,
  postMessage,
  markThreadReadByTenant,
} from '../lib/messages'

export default function TenantPortalPage({
  tenant,
  unit,
  building,
  payments,
  settings,
  currentPage,
  showToast,
  onSubmitPayment,
  showOnboarding,
  onDismissOnboarding,
  setPageSafe,
}) {
  const [payForm, setPayForm] = useState({ amount: '', method: 'MTN MoMo', reference: '' })
  const [payLoading, setPayLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [msgTick, setMsgTick] = useState(0)
  const [viewingReceipt, setViewingReceipt] = useState(null)

  if (!tenant) return <EmptyState message="Your tenant profile was not found. Contact your landlord." />

  const safeBuilding = getTenantSafeBuilding(building)
  const safeUnit = getTenantSafeUnit(unit)
  const safeTenant = getTenantSafeTenantRecord(tenant)

  const tenantPayments = payments.filter((p) => p.tenantId === tenant.id)
  const balance = computeArrears(
    { id: safeTenant.id, rentAmount: safeTenant.rentAmount, leaseStart: safeTenant.leaseStart, rentDueDay: unit?.rentDueDay },
    tenantPayments,
  )
  const rentPayments = tenantPayments.filter((p) => p.type === 'rent').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12)
  const dueDate = nextDueDate(unit?.rentDueDay || tenant.rentDueDay || 5)
  const guidance = getPageGuidance('tenant', currentPage || 'my-balance', {})

  const paymentNumbers = {
    mtn: settings.mtnMomo || settings.paymentMtn || '+256 770 000 000',
    airtel: settings.airtelMoney || settings.paymentAirtel || '+256 750 000 000',
    bank: settings.bankAccount || '',
  }

  const copyRef = () => {
    const ref = `${safeUnit?.unitNumber || 'UNIT'}-${tenant.lastName}`
    navigator.clipboard?.writeText(ref)
    showToast?.('Reference copied!', 'success')
  }

  const openMoMo = (network) => {
    const num = (network === 'mtn' ? paymentNumbers.mtn : paymentNumbers.airtel).replace(/\D/g, '')
    const text = encodeURIComponent(
      `Rent payment ${formatCurrency(tenant.rentAmount)} for ${safeUnit?.unitNumber}. Ref: ${safeUnit?.unitNumber}-${tenant.lastName}`,
    )
    window.open(`https://wa.me/${num}?text=${text}`, '_blank')
  }

  const handleIPaid = (e) => {
    e.preventDefault()
    if (!payForm.amount || !payForm.reference) {
      showToast?.('Enter amount and transaction reference', 'error')
      return
    }
    setPayLoading(true)
    onSubmitPayment?.({
      amount: Number(payForm.amount),
      method: payForm.method,
      reference: payForm.reference.trim(),
      status: 'pending',
    })
    setPayForm({ amount: '', method: 'MTN MoMo', reference: '' })
    setTimeout(() => setPayLoading(false), 400)
  }

  const viewReceipt = (payment) => {
    const receiptData = buildReceiptData(payment, tenant, unit, building, settings, balance.balance)
    setViewingReceipt(receiptData)
  }

  const receiptModal = (
    <ReceiptViewerModal
      open={!!viewingReceipt}
      onClose={() => setViewingReceipt(null)}
      receiptData={viewingReceipt}
    />
  )

  if (showOnboarding) {
    return (
      <>
        <div className="card p-6 text-center max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-[#2d6a4f] mb-2">Welcome to NyumbaTrack</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You rent <strong>{safeUnit?.unitNumber}</strong> at <strong>{safeBuilding?.name}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">Monthly rent: {formatCurrency(tenant.rentAmount)}</p>
        <button type="button" className="w-full py-3 bg-[#2d6a4f] text-white rounded-lg font-medium" onClick={onDismissOnboarding}>
          Get Started
        </button>
        </div>
        {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-messages') {
    const thread = getThread(String(safeUnit?.id || unit?.id), String(safeTenant.id))
    if (unit?.id && tenant?.id) markThreadReadByTenant(tenant.id, unit.id)

    const sendMsg = () => {
      if (!messageText.trim() || !tenant || !unit) return
      postMessage({
        ownerId: String(tenant.ownerId || building?.ownerId || ''),
        unitId: String(unit.id),
        tenantId: String(tenant.id),
        buildingId: String(tenant.buildingId),
        fromRole: 'tenant',
        authorName: `${safeTenant.firstName} ${safeTenant.lastName}`,
        body: messageText.trim(),
      })
      setMessageText('')
      setMsgTick((n) => n + 1)
      showToast?.('Message sent to your landlord', 'success')
    }

    return (
      <>
      <div className="space-y-4 pb-24">
        <GuidancePanel guidance={guidance} />
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle size={22} /> Contact landlord
        </h1>
        <p className="text-sm text-gray-500">Wrong amount? Ask about your lease or payments here.</p>
        <div className="card p-3 text-sm space-y-1">
          <p><strong>Phone:</strong> {String(building?.caretakerPhone || settings?.whatsappNumber || '—')}</p>
          <p><strong>Email:</strong> {String(settings?.managerEmail || settings?.companyEmail || '—')}</p>
        </div>
        <div className="card p-4 min-h-[200px] flex flex-col">
          <div className="flex-1 space-y-2 mb-3 max-h-[40vh] overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet. Say hello or ask a question.</p>
            ) : (
              thread.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded text-sm max-w-[85%] ${
                    m.fromRole === 'tenant' ? 'ml-auto bg-[#2d6a4f] text-white' : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p>{m.body}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Type your message…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button type="button" onClick={sendMsg} className="px-3 py-2 bg-[#2d6a4f] text-white rounded">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      {receiptModal}
      </>
    )
  }

  if (currentPage === 'help') {
    return null
  }

  if (currentPage === 'my-balance' || !currentPage) {
    return (
      <>
      <div className="space-y-5 pb-24">
        <GuidancePanel guidance={guidance} />
        <h1 className="text-lg font-bold">
          Hello, {String(safeTenant.firstName || 'Tenant')}
        </h1>
        <p className="text-sm text-gray-500">{safeUnit?.unitNumber} · {safeBuilding?.name}</p>

        <div className={`card p-6 text-center ${balance.isInArrears ? 'border-2 border-red-500' : 'border-2 border-green-500'}`}>
          <p className="text-sm text-gray-500">What I owe</p>
          <p className={`text-3xl font-bold mt-1 ${balance.isInArrears ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(balance.balance)}
          </p>
          <Badge color={balance.isInArrears ? 'red' : 'green'}>{balance.isInArrears ? 'AMOUNT DUE' : 'UP TO DATE'}</Badge>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Next payment</h2>
          <p className="text-lg">{formatDate(dueDate)} — {formatCurrency(safeTenant.rentAmount)}</p>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Smartphone size={18} /> Pay rent</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Use the numbers your landlord provided:</p>
          <div className="grid gap-2">
            <button type="button" onClick={() => openMoMo('mtn')} className="w-full py-3 px-4 bg-yellow-500 text-black rounded-lg font-medium text-left">
              MTN MoMo: {paymentNumbers.mtn}
            </button>
            <button type="button" onClick={() => openMoMo('airtel')} className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium text-left">
              Airtel Money: {paymentNumbers.airtel}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <span>Reference: <strong>{safeUnit?.unitNumber}-{tenant.lastName}</strong></span>
            <button type="button" onClick={copyRef} className="ml-auto p-1"><Copy size={16} /></button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPageSafe?.('my-messages')}
          className="w-full card p-4 text-left flex items-center gap-3 hover:ring-2 hover:ring-[#2d6a4f]/30"
        >
          <MessageCircle className="text-[#2d6a4f]" size={22} />
          <div>
            <p className="font-semibold text-sm">Contact landlord</p>
            <p className="text-xs text-gray-500">Wrong amount? Send a message</p>
          </div>
        </button>
      </div>
      {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-payments') {
    return (
      <>
      <div className="space-y-4 pb-24">
        <GuidancePanel guidance={guidance} />
        <h1 className="text-xl font-bold">My Payments</h1>

        <form onSubmit={handleIPaid} className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm">I paid — notify landlord</h2>
          <input
            type="number"
            placeholder={`Amount (UGX) — rent is ${tenant.rentAmount}`}
            className="w-full border rounded px-3 py-2.5 text-base"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />
          <select className="w-full border rounded px-3 py-2.5" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
            <option>MTN MoMo</option>
            <option>Airtel Money</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
          </select>
          <input
            placeholder="Transaction reference / ID"
            className="w-full border rounded px-3 py-2.5 text-base"
            value={payForm.reference}
            onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
          />
          <LoadingButton loading={payLoading} className="w-full py-3 bg-[#2d6a4f] text-white rounded-lg font-medium">
            Submit payment notice
          </LoadingButton>
        </form>

        {rentPayments.length === 0 ? (
          <EmptyState message="Nothing due yet — your first payment will appear here after your landlord confirms it." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {rentPayments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{formatDate(p.date)}</td>
                    <td className="p-2">{formatCurrency(p.amount)}</td>
                    <td className="p-2">{p.method}{p.status === 'pending' ? ' (pending)' : ''}</td>
                    <td className="p-2">
                      {p.receiptNo && (
                        <button type="button" className="text-[#2d6a4f] underline font-medium" onClick={() => viewReceipt(p)}>View receipt</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-lease') {
    const depositStatus = safeTenant.depositPaid >= safeTenant.depositAmount ? 'Paid' : safeTenant.depositPaid > 0 ? 'Partial' : 'Not Paid'
    const sharedDoc = safeTenant.sharedAgreement
    return (
      <>
      <div className="space-y-4 pb-24">
        <GuidancePanel guidance={guidance} />
        <h1 className="text-xl font-bold">My Lease</h1>
        <div className="card p-4 space-y-2 text-sm">
          <p><strong>Property:</strong> {String(safeBuilding?.name || '—')}</p>
          <p><strong>Unit:</strong> {String(safeUnit?.unitNumber || '—')}</p>
          <p><strong>Start:</strong> {formatDate(safeTenant.leaseStart)}</p>
          <p><strong>End:</strong> {formatDate(safeTenant.leaseEnd)}</p>
          <p><strong>Monthly rent:</strong> {formatCurrency(safeTenant.rentAmount)}</p>
          <p><strong>Deposit:</strong> <Badge color={depositStatus === 'Paid' ? 'green' : depositStatus === 'Partial' ? 'orange' : 'red'}>{depositStatus}</Badge></p>
        </div>
        {sharedDoc?.dataUrl && (
          <div className="card p-4 text-sm">
            <h2 className="font-semibold mb-2">Your agreement</h2>
            <a href={sharedDoc.dataUrl} target="_blank" rel="noreferrer" className="text-[#2d6a4f] underline">
              Open {String(sharedDoc.fileName || 'agreement.pdf')}
            </a>
          </div>
        )}
        <p className="text-xs text-gray-500">If something looks wrong, contact your landlord — not the app developer.</p>
        {settings.showLandlordContact !== false && (
          <div className="card p-4 text-sm">
            <h2 className="font-semibold mb-2">Contact</h2>
            <p>Caretaker: {building?.caretakerName || settings.managerName || '—'}</p>
            <p>Phone: {building?.caretakerPhone || settings.whatsappNumber || '—'}</p>
          </div>
        )}
        <div className="card p-4">
          <h2 className="font-semibold mb-2">House rules</h2>
          <p className="text-sm whitespace-pre-wrap">{settings.houseRulesText}</p>
        </div>
      </div>
      {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-receipts') {
    const withReceipts = tenantPayments.filter((p) => p.receiptNo)
    return (
      <>
      <div className="space-y-4 pb-24">
        <h1 className="text-xl font-bold">My Receipts</h1>
        {withReceipts.length === 0 ? <EmptyState message="No receipts yet." /> : (
          <div className="grid gap-3">
            {withReceipts.map((p) => (
              <div key={p.id} className="card p-3 flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm">{p.receiptNo} — {formatDate(p.date)} — {formatCurrency(p.amount)}</span>
                <button type="button" className="px-3 py-2 bg-[#2d6a4f] text-white rounded text-sm min-h-[44px]" onClick={() => viewReceipt(p)}>View receipt</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {receiptModal}
      </>
    )
  }

  return receiptModal
}
