import React, { useState } from 'react'
import { Gift, Copy, Link2, Users } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getPageGuidance } from '../lib/actionGuidance'
import {
  getPartnerRewards,
  getReferralLink,
  getReferralShareMessage,
} from '../lib/partnerRewards'
import { btnPrimary } from '../lib/formStyles'

export default function ReferralsPage({ activeOwnerId, authUser, showToast, setCurrentPage }) {
  const ownerId = activeOwnerId || authUser?.ownerId || authUser?.id || ''
  const [rewards] = useState(() => (ownerId ? getPartnerRewards(ownerId) : null))

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 p-4">
      <div className="flex items-center gap-3">
        <Gift className="text-brand" size={28} />
        <div>
          <h1 className="text-2xl font-bold">Partner Rewards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Refer landlords · earn free months</p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="card p-5 border-2 border-brand/25 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users size={18} /> Your invite link
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Share this with another property owner. When they subscribe to a paid plan, you bank free months toward your renewal.
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-center text-lg tracking-widest">
          {rewards.referralCode}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => copy(link, 'Link')} className={`tap-target flex items-center gap-1 px-3 py-2 text-xs ${btnPrimary}`}>
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
          <p className="text-2xl font-bold text-brand">{rewards.bankedMonths}</p>
          <p className="text-xs text-gray-500 mt-1">Months banked</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{rewards.successfulReferrals}</p>
          <p className="text-xs text-gray-500 mt-1">Successful referrals</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand">{rewards.pendingReferrals}</p>
          <p className="text-xs text-gray-500 mt-1">Pending sign-ups</p>
        </div>
      </div>

      <div className="card p-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">How it works</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Copy your link and send it to a fellow landlord.</li>
          <li>They create an owner account and start a paid plan.</li>
          <li>You bank free months — applied on your next renewal.</li>
        </ol>
      </div>

      <button type="button" onClick={() => setCurrentPage('subscription')} className="text-sm text-brand underline">
        Back to Plans & Billing
      </button>
    </div>
  )
}
