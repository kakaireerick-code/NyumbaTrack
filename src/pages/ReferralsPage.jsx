import React, { useState } from 'react'
import { Gift, Copy, Link2, Users, CheckCircle2, Circle } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import {
  getPartnerRewards,
  getReferralLink,
  getReferralShareMessage,
  markReferralLinkShared,
  formatCreditSummary,
  MAX_CREDIT_PERCENT,
  CREDIT_PERCENT_PER_REFERRAL,
} from '../lib/partnerRewards'
import { btnPrimary } from '../lib/formStyles'

export default function ReferralsPage({ activeOwnerId, authUser, showToast, setCurrentPage }) {
  const ownerId = activeOwnerId || authUser?.ownerId || authUser?.id || ''
  const [rewards, setRewards] = useState(() => (ownerId ? getPartnerRewards(ownerId) : null))

  const guidance = getPageGuidance('property_owner', 'referrals', {})

  if (!ownerId || !rewards) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-gray-500">Sign in as a property owner to use Partner Rewards.</p>
      </div>
    )
  }

  const link = getReferralLink(rewards.referralCode)
  const message = getReferralShareMessage(rewards.referralCode, authUser?.name || 'I')

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast?.(`${label} copied`, 'success')
    } catch {
      showToast?.('Copy failed — select and copy manually', 'error')
    }
  }

  const onCopyLink = () => {
    const next = markReferralLinkShared(ownerId)
    setRewards(next)
    copy(link, 'Link')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 p-4">
      <div className="flex items-center gap-3">
        <Gift className="text-brand" size={28} />
        <div>
          <h1 className="text-2xl font-bold">Partner Rewards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {CREDIT_PERCENT_PER_REFERRAL}% credit per referral · max {MAX_CREDIT_PERCENT}%
          </p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="card p-4 bg-brand/5 border border-brand/20 text-sm text-gray-700 dark:text-gray-300">
        {formatCreditSummary(rewards)}
      </div>

      <div className="card p-5 border-2 border-brand/25 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users size={18} /> Your invite link
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          When a referred owner completes their first login, you automatically earn {CREDIT_PERCENT_PER_REFERRAL}% billing credit (up to {MAX_CREDIT_PERCENT}% total).
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-center text-lg tracking-widest">
          {rewards.referralCode}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCopyLink} className={`tap-target flex items-center gap-1 px-3 py-2 text-xs ${btnPrimary}`}>
            <Link2 size={14} /> Copy referral link
          </button>
          <button type="button" onClick={() => copy(rewards.referralCode, 'Code')} className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg">
            <Copy size={14} /> Copy code only
          </button>
          <button type="button" onClick={() => copy(message, 'Message')} className="tap-target flex items-center gap-1 px-3 py-2 text-xs border rounded-lg">
            <Copy size={14} /> Copy WhatsApp message
          </button>
        </div>
        <p className="text-[10px] text-gray-400 break-all">{link}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{rewards.creditPercent}%</p>
          <p className="text-xs text-gray-500 mt-1">Billing credit</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{rewards.successfulReferrals}</p>
          <p className="text-xs text-gray-500 mt-1">Credited referrals</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{rewards.pendingReferrals}</p>
          <p className="text-xs text-gray-500 mt-1">Pending sign-ups</p>
        </div>
      </div>

      {rewards.referrals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Referral tracker</h3>
          {rewards.referrals.map((ref) => (
            <div key={ref.id} className="card p-4 space-y-2">
              <p className="font-medium text-sm">
                {ref.referredName || ref.referredEmail || 'Shared link'}
                <span className="ml-2 text-xs text-gray-500 capitalize">({ref.status})</span>
              </p>
              <ul className="space-y-1">
                {ref.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    {step.done ? (
                      <CheckCircle2 size={14} className="text-brand shrink-0" />
                    ) : (
                      <Circle size={14} className="text-gray-400 shrink-0" />
                    )}
                    {step.label}
                    {step.at && <span className="text-gray-400">· {step.at.split('T')[0]}</span>}
                  </li>
                ))}
              </ul>
              {ref.creditPercent > 0 && (
                <p className="text-xs text-brand">+{ref.creditPercent}% credit applied</p>
              )}
            </div>
          ))}
        </div>
      )}

      {rewards.creditNotes.length > 0 && (
        <div className="card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Auto credit notes</h3>
          {rewards.creditNotes.map((note) => (
            <div key={note.id} className="text-xs border-l-2 border-brand/40 pl-3 py-1">
              <p className="font-medium">{note.date} · +{note.percent}%</p>
              <p className="text-gray-600 dark:text-gray-400">{note.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">How it works</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Copy your link and send it to a fellow landlord.</li>
          <li>They create an owner account (signup tracked automatically).</li>
          <li>On their first login you earn {CREDIT_PERCENT_PER_REFERRAL}% — auto-applied to your next invoice.</li>
        </ol>
      </div>

      <button type="button" onClick={() => setCurrentPage('subscription')} className="text-sm text-brand underline">
        Back to Plans & Billing
      </button>
    </div>
  )
}
