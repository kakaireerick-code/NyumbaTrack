import React, { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Copy, RefreshCw, Shield, XCircle } from 'lucide-react'
import { fmtUGX, fmtDate } from '../utils/helpers'
import { getPlanById } from '../data/subscriptionPlans'
import {
  BILLING_ADMIN_SECRET_KEY,
  fetchPendingClaims,
  reviewClaim,
} from '../lib/billingAdmin'
import { countPendingClaims, filterClaimsByStatus, claimSummaryLine } from '../lib/subscriptionAdminSync'
import { inputCls, btnPrimary, btnSecondary } from '../lib/formStyles'
import { Badge, LoadingButton } from '../components/UI'

const statusColor = (status) => {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  return 'orange'
}

export default function BillingAdminPage({ showToast, authUser }) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(BILLING_ADMIN_SECRET_KEY) || '')
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState('')
  const [filter, setFilter] = useState('pending_verification')

  const loadClaims = useCallback(async () => {
    if (!secret.trim()) return
    setLoading(true)
    try {
      const rows = await fetchPendingClaims(secret.trim())
      setClaims(rows)
      sessionStorage.setItem(BILLING_ADMIN_SECRET_KEY, secret.trim())
    } catch (err) {
      showToast(err.message || 'Could not load claims', 'error')
    } finally {
      setLoading(false)
    }
  }, [secret, showToast])

  useEffect(() => {
    if (secret.trim().length >= 8) loadClaims()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (claim, action) => {
    const note =
      action === 'reject'
        ? window.prompt('Rejection note (optional):', '') || ''
        : ''
    setActionId(claim.momoReference)
    try {
      const updated = await reviewClaim(secret.trim(), claim.momoReference, action, note)
      setClaims((rows) => rows.map((r) => (r.momoReference === updated.momoReference ? updated : r)))
      showToast(
        action === 'approve'
          ? `Approved ${claim.customerEmail} — notify them to refresh the app`
          : `Rejected ${claim.momoReference}`,
        action === 'approve' ? 'success' : 'warning',
      )
    } catch (err) {
      showToast(err.message || 'Review failed', 'error')
    } finally {
      setActionId('')
    }
  }

  const copyClaim = async (claim) => {
    try {
      await navigator.clipboard.writeText(claimSummaryLine(claim))
      showToast('Claim copied', 'success')
    } catch {
      showToast('Copy failed', 'error')
    }
  }

  const visible = filterClaimsByStatus(claims, filter)
  const pendingCount = countPendingClaims(claims)

  return (
    <div className="p-4 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-[#2d6a4f]" size={28} />
            Billing admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Verify MoMo payments and activate subscriptions. Signed in as {authUser?.email}.
          </p>
        </div>
        <Badge color="purple">PC operator panel</Badge>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Admin API secret</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Paste the <code className="text-xs">BILLING_ADMIN_SECRET</code> from Vercel Production env
          (same value used for <code className="text-xs">SETUP-BILLING-ADMIN.ps1</code>).
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="password"
            className={`${inputCls} max-w-md flex-1`}
            placeholder="Bearer secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <LoadingButton loading={loading} onClick={loadClaims} className={btnPrimary}>
            <RefreshCw size={16} className="inline mr-1" />
            Load claims
          </LoadingButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Show:</span>
        {['pending_verification', 'approved', 'rejected', 'all'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm border ${
              filter === key
                ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-auto">
          {visible.length} shown · {pendingCount} pending
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          {secret.trim() ? 'No claims in this filter.' : 'Enter admin secret and load claims.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((claim) => {
            const plan = getPlanById(claim.planId)
            const pending = claim.status === 'pending_verification'
            return (
              <div key={claim.momoReference} className="card p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{claim.customerName}</p>
                    <p className="text-sm text-gray-500">{claim.customerEmail}</p>
                  </div>
                  <Badge color={statusColor(claim.status)}>{claim.status.replace('_', ' ')}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Plan</p>
                    <p className="font-medium">{plan?.name || claim.planId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">{fmtUGX(claim.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">MoMo ref</p>
                    <p className="font-mono text-xs break-all">{claim.momoReference}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p>{fmtDate(claim.submittedAt)}</p>
                  </div>
                </div>
                {claim.reviewNote ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Note: {claim.reviewNote}</p>
                ) : null}
                {pending ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <LoadingButton
                      loading={actionId === claim.momoReference}
                      onClick={() => handleReview(claim, 'approve')}
                      className={`${btnPrimary} flex items-center gap-1`}
                    >
                      <CheckCircle size={16} />
                      Approve MoMo
                    </LoadingButton>
                    <button
                      type="button"
                      disabled={actionId === claim.momoReference}
                      onClick={() => handleReview(claim, 'reject')}
                      className={`${btnSecondary} flex items-center gap-1 text-red-700 dark:text-red-300`}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => copyClaim(claim)}
                      className={`${btnSecondary} flex items-center gap-1`}
                    >
                      <Copy size={16} />
                      Copy line
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
