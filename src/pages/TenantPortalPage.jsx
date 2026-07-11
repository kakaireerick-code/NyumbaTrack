import React, { useState, useMemo, useEffect } from 'react'
import { formatDate, nextDueDate } from '../lib/dates'
import { computeArrears, formatCurrency } from '../lib/rentLedger'
import { getTenantSafeBuilding, getTenantSafeUnit, getTenantSafeTenantRecord } from '../lib/propertyViews'
import { Badge, EmptyState, LoadingButton } from '../components/UI'
import { buildReceiptData } from '../utils/receipts'
import ReceiptViewerModal from '../components/ReceiptViewerModal'
import GuidancePanel from '../components/GuidancePanel'
import ProductHighlights from '../components/ProductHighlights'
import TenantBehaviorDashboard from '../components/TenantBehaviorDashboard'
import { getPageGuidance } from '../lib/actionGuidance'
import { Smartphone, Copy, MessageCircle, Send } from 'lucide-react'
import { computeTenantBehavior } from '../lib/tenantBehavior'
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
  onOpenReceipt,
  authUser,
}) {
  const [payForm, setPayForm] = useState({ amount: '', method: 'MTN MoMo', reference: '' })
  const [payLoading, setPayLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [msgTick, setMsgTick] = useState(0)
  const [viewingReceipt, setViewingReceipt] = useState(null)

  const effectiveUnitId = String(unit?.id ?? tenant?.unitId ?? authUser?.unitId ?? '')
  const effectiveTenantId = String(tenant?.id ?? authUser?.tenantId ?? '')
  const effectiveOwnerId = String(
    tenant?.ownerId ?? building?.ownerId ?? unit?.ownerId ?? authUser?.ownerId ?? '',
  )
  const effectiveBuildingId = String(tenant?.buildingId ?? unit?.buildingId ?? authUser?.buildingId ?? '')

  const thread = useMemo(
    () => (effectiveUnitId && effectiveTenantId ? getThread(effectiveUnitId, effectiveTenantId) : []),
    [effectiveUnitId, effectiveTenantId, msgTick],
  )

  useEffect(() => {
    if (currentPage === 'my-messages' && effectiveTenantId && effectiveUnitId) {
      markThreadReadByTenant(effectiveTenantId, effectiveUnitId)
    }
  }, [currentPage, effectiveTenantId, effectiveUnitId, msgTick])

  if (!tenant) return <EmptyState message="Your tenant profile was not found. Contact your landlord." />

  const safeBuilding = getTenantSafeBuilding(building)
  const safeUnit = getTenantSafeUnit(unit)
  const safeTenant = getTenantSafeTenantRecord(tenant)

  const tenantPayments = payments.filter((p) => String(p.tenantId) === effectiveTenantId)
  const balance = computeArrears(
    { id: safeTenant.id, rentAmount: safeTenant.rentAmount, leaseStart: safeTenant.leaseStart, rentDueDay: unit?.rentDueDay },
    tenantPayments,
  )
  const rentPayments = tenantPayments.filter((p) => p.type === 'rent').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12)
  const dueDate = nextDueDate(unit?.rentDueDay || tenant.rentDueDay || 5)
  const guidance = getPageGuidance('tenant', currentPage || 'my-dashboard', {})

  const hasMtn = !!String(settings.mtnMomo || settings.paymentMtn || '').trim()
  const hasAirtel = !!String(settings.airtelMoney || settings.paymentAirtel || '').trim()
  const paymentNumbers = {
    mtn: hasMtn ? (settings.mtnMomo || settings.paymentMtn) : '',
    airtel: hasAirtel ? (settings.airtelMoney || settings.paymentAirtel) : '',
    bank: settings.bankAccount || '',
  }
  const paymentNumbersMissing = !hasMtn && !hasAirtel && !paymentNumbers.bank

  const copyRef = () => {
    const ref = `${safeUnit?.unitNumber || 'UNIT'}-${tenant.lastName}`
    navigator.clipboard?.writeText(ref)
    showToast?.('Reference copied!', 'success')
  }

  const openMoMo = (network) => {
    const num = (network === 'mtn' ? paymentNumbers.mtn : paymentNumbers.airtel).replace(/\D/g, '')
    if (!num) {
      showToast?.('Your landlord has not added this payment number yet. Send them a message.', 'info')
      setPageSafe?.('my-messages')
      return
    }
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
    const receiptId = payment.receiptId || payment.receiptNo
    if (onOpenReceipt && receiptId) {
      onOpenReceipt(receiptId)
      return
    }
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

  const sendMsg = () => {
    if (!messageText.trim()) return
    if (!effectiveTenantId) {
      showToast?.('Your tenant profile is incomplete. Contact your landlord.', 'error')
      return
    }
    if (!effectiveUnitId) {
      showToast?.('Your unit could not be found. Contact your landlord.', 'error')
      return
    }
    if (!effectiveOwnerId) {
      showToast?.('Landlord account not linked yet. Ask your landlord to confirm your registration.', 'error')
      return
    }
    try {
      postMessage({
        ownerId: effectiveOwnerId,
        unitId: effectiveUnitId,
        tenantId: effectiveTenantId,
        buildingId: effectiveBuildingId,
        fromRole: 'tenant',
        authorName: `${safeTenant.firstName} ${safeTenant.lastName}`,
        body: messageText.trim(),
      })
      setMessageText('')
      setMsgTick((n) => n + 1)
      showToast?.('Message sent to your landlord', 'success')
    } catch {
      showToast?.('Could not send message. Try again or contact your landlord by phone.', 'error')
    }
  }

  if (showOnboarding) {
    return (
      <>
        <div className="card p-6 text-center max-w-md mx-auto mt-8">
        <h2 className="text-xl font-bold text-brand mb-2">Welcome to NyumbaTrack</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You rent <strong>{safeUnit?.unitNumber}</strong> at <strong>{safeBuilding?.name}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">Monthly rent: {formatCurrency(tenant.rentAmount)}</p>
        <button type="button" className="w-full py-3 bg-brand text-white rounded-lg font-medium" onClick={onDismissOnboarding}>
          Get Started
        </button>
        </div>
        {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-messages') {
    return (
      <>
      <div className="flex flex-col min-h-[calc(100vh-12rem)] max-w-2xl mx-auto w-full">
        <div className="space-y-4 flex-1 pb-4">
          <GuidancePanel guidance={guidance} />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle size={22} className="text-brand" /> Contact landlord
          </h1>
          <p className="text-sm text-gray-500">Wrong amount? Ask about your lease or payments here.</p>
          <div className="card p-3 text-sm space-y-1 bg-brand/5 border border-brand/15">
            <p><strong>Phone:</strong> {String(building?.caretakerPhone || settings?.whatsappNumber || '—')}</p>
            <p><strong>Email:</strong> {String(settings?.managerEmail || settings?.companyEmail || '—')}</p>
          </div>
          <div className="card p-4 flex flex-col flex-1 min-h-[280px]">
            <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[50vh]">
              {thread.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No messages yet. Say hello or ask a question.</p>
              ) : (
                thread.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl text-sm max-w-[88%] ${
                      m.fromRole === 'tenant'
                        ? 'ml-auto bg-brand text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {m.fromRole === 'owner' && (
                      <p className="text-[10px] opacity-70 mb-0.5">{m.authorName || 'Landlord'}</p>
                    )}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.fromRole === 'tenant' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleString('en-UG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface dark:bg-gray-900 pt-2 pb-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-3 text-base dark:bg-gray-800 dark:border-gray-600"
              placeholder="Type your message…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMsg()}
            />
            <button type="button" onClick={sendMsg} className="tap-target px-4 py-3 bg-brand text-white rounded-lg shrink-0">
              <Send size={20} />
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

  if (currentPage === 'my-dashboard' || currentPage === 'my-balance' || !currentPage) {
    const behaviorStats = computeTenantBehavior({
      tenant: {
        id: effectiveTenantId,
        leaseStart: String(tenant.leaseStart || ''),
        leaseEnd: tenant.leaseEnd ? String(tenant.leaseEnd) : undefined,
        rentAmount: Number(safeTenant.rentAmount || tenant.rentAmount || 0),
        rentDueDay: unit?.rentDueDay || tenant.rentDueDay || 5,
        depositPaid: Number(tenant.depositPaid || 0),
        depositAmount: Number(tenant.depositAmount || 0),
        status: String(tenant.status || ''),
      },
      payments: tenantPayments,
      balance,
      messagesSent: thread.filter((m) => m.fromRole === 'tenant').length,
    })

    return (
      <>
      <div className="space-y-5 pb-24 max-w-2xl mx-auto w-full">
        <GuidancePanel guidance={guidance} />
        <TenantBehaviorDashboard
          stats={behaviorStats}
          balance={balance}
          dueDate={dueDate}
          rentAmount={safeTenant.rentAmount}
          firstName={String(safeTenant.firstName || 'Tenant')}
          unitLabel={safeUnit?.unitNumber}
          buildingName={safeBuilding?.name}
          onPay={() => setPageSafe?.('my-payments')}
          onMessages={() => setPageSafe?.('my-messages')}
        />
        <ProductHighlights
          currentRole="tenant"
          surface="tenant-home"
          setCurrentPage={setPageSafe}
          variant="compact"
        />
      </div>
      {receiptModal}
      </>
    )
  }

  if (currentPage === 'my-payments') {
    return (
      <>
      <div className="space-y-4 pb-24 max-w-2xl mx-auto w-full">
        <GuidancePanel guidance={guidance} />
        <h1 className="text-xl font-bold">My Payments</h1>

        <div className="card p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Smartphone size={18} /> Pay rent</h2>
          {paymentNumbersMissing ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              Your landlord has not added payment numbers yet. Use Messages to ask where to send rent.
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Use the numbers your landlord provided:</p>
          )}
          <div className="grid gap-2">
            {hasMtn && (
              <button type="button" onClick={() => openMoMo('mtn')} className="w-full py-3 px-4 bg-yellow-500 text-black rounded-lg font-medium text-left">
                MTN MoMo: {paymentNumbers.mtn}
              </button>
            )}
            {hasAirtel && (
              <button type="button" onClick={() => openMoMo('airtel')} className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium text-left">
                Airtel Money: {paymentNumbers.airtel}
              </button>
            )}
            {paymentNumbers.bank && (
              <div className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                <span className="font-medium">Bank:</span> {paymentNumbers.bank}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
            <span>Reference: <strong>{safeUnit?.unitNumber}-{tenant.lastName}</strong></span>
            <button type="button" onClick={copyRef} className="ml-auto p-1 tap-target"><Copy size={16} /></button>
          </div>
        </div>

        <form onSubmit={handleIPaid} className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm">I paid — notify landlord</h2>
          <input
            type="number"
            placeholder={`Amount (UGX) — rent is ${tenant.rentAmount}`}
            className="w-full border rounded-lg px-3 py-2.5 text-base dark:bg-gray-800 dark:border-gray-600"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />
          <select className="w-full border rounded-lg px-3 py-2.5 dark:bg-gray-800 dark:border-gray-600" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
            <option>MTN MoMo</option>
            <option>Airtel Money</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
          </select>
          <input
            placeholder="Transaction reference / ID"
            className="w-full border rounded-lg px-3 py-2.5 text-base dark:bg-gray-800 dark:border-gray-600"
            value={payForm.reference}
            onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
          />
          <LoadingButton loading={payLoading} className="w-full py-3 bg-brand text-white rounded-lg font-medium">
            Submit payment notice
          </LoadingButton>
        </form>

        {rentPayments.length === 0 ? (
          <EmptyState message="Nothing due yet — your first payment will appear here after your landlord confirms it." />
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {rentPayments.map((p) => (
                <div key={p.id} className="card p-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{formatCurrency(p.amount)}</p>
                    <span className="text-xs text-gray-500">{formatDate(p.date)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {p.method}{p.status === 'pending' ? ' (pending)' : ''}
                  </p>
                  {p.receiptNo && (
                    <button type="button" className="text-brand underline font-medium text-sm tap-target" onClick={() => viewReceipt(p)}>
                      View receipt
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="hidden md:block table-scroll">
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
                          <button type="button" className="text-brand underline font-medium" onClick={() => viewReceipt(p)}>View receipt</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
      <div className="space-y-4 pb-24 max-w-2xl mx-auto w-full">
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
            <a href={sharedDoc.dataUrl} target="_blank" rel="noreferrer" className="text-brand underline">
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
      <div className="space-y-4 pb-24 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-bold">My Receipts</h1>
        {withReceipts.length === 0 ? <EmptyState message="No receipts yet." /> : (
          <div className="grid gap-3">
            {withReceipts.map((p) => (
              <div key={p.id} className="card p-3 flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm">{p.receiptNo} — {formatDate(p.date)} — {formatCurrency(p.amount)}</span>
                <button type="button" className="px-3 py-2 bg-brand text-white rounded text-sm min-h-[44px]" onClick={() => viewReceipt(p)}>View receipt</button>
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
