import React from 'react'
import {
  TrendingUp,
  Calendar,
  MessageCircle,
  Wallet,
  Award,
  Flame,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { Badge, ProgressBar } from './UI'
import { formatCurrency } from '../lib/rentLedger'
import { formatDate } from '../lib/dates'

const GRADE_COLORS = {
  Excellent: 'green',
  Good: 'green',
  Fair: 'orange',
  'Needs attention': 'red',
}

const RENT_STATUS_LABELS = {
  up_to_date: { label: 'Up to date', color: 'green' },
  due_soon: { label: 'Due soon', color: 'orange' },
  late: { label: 'Late', color: 'red' },
  behind: { label: 'Behind', color: 'red' },
}

export default function TenantBehaviorDashboard({
  stats,
  balance,
  dueDate,
  rentAmount,
  firstName,
  unitLabel,
  buildingName,
  onPay,
  onMessages,
}) {
  const rentChip = RENT_STATUS_LABELS[stats.rentStatus] || RENT_STATUS_LABELS.up_to_date

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Hello, {firstName || 'Tenant'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{unitLabel} · {buildingName}</p>
      </div>

      <div className="card p-5 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Award size={16} className="text-brand" /> Your tenant score
            </p>
            <p className="text-4xl font-bold text-brand mt-1">{stats.overallScore}</p>
            <Badge color={GRADE_COLORS[stats.grade] || 'gray'}>{stats.grade}</Badge>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-gray-500">Rent status</p>
            <Badge color={rentChip.color}>{rentChip.label}</Badge>
            <p className="text-xs text-gray-500 mt-2">
              {balance.isInArrears ? formatCurrency(balance.balance) + ' due' : 'Nothing owed'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar pct={stats.overallScore} color="#2d6a4f" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp size={14} /> On-time payments</p>
          <p className="text-2xl font-bold text-brand mt-1">{stats.onTimePaymentRate}%</p>
          <p className="text-[11px] text-gray-500">{stats.onTimePayments} of {stats.totalPaymentEvents || '—'} on time</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><Flame size={14} /> Payment streak</p>
          <p className="text-2xl font-bold text-brand mt-1">{stats.paymentStreak}</p>
          <p className="text-[11px] text-gray-500">months in a row</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={14} /> Time here</p>
          <p className="text-2xl font-bold mt-1">{stats.monthsTenanted}</p>
          <p className="text-[11px] text-gray-500">months tenanted</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><Wallet size={14} /> Total paid</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(stats.totalRentPaid)}</p>
          <p className="text-[11px] text-gray-500">{stats.confirmedPayments} confirmed</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><MessageCircle size={14} /> Messages</p>
          <p className="text-2xl font-bold mt-1">{stats.messagesSent}</p>
          <p className="text-[11px] text-gray-500">sent to landlord</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><Shield size={14} /> Deposit</p>
          <p className="text-2xl font-bold mt-1">{stats.depositProgress}%</p>
          <ProgressBar pct={stats.depositProgress} color="#2d6a4f" />
        </div>
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Next payment</h2>
        <p className="text-lg">{formatDate(dueDate)} — {formatCurrency(rentAmount)}</p>
        {stats.pendingPayments > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {stats.pendingPayments} payment notice{stats.pendingPayments > 1 ? 's' : ''} awaiting landlord confirmation
          </p>
        )}
      </div>

      {stats.tips.length > 0 && (
        <div className="card p-4 bg-brand/5 border border-brand/15 space-y-2">
          <h2 className="font-semibold text-sm text-brand">Tips to improve</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 list-disc pl-4">
            {stats.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPay}
          className="card p-4 text-left flex items-center justify-between hover:ring-2 hover:ring-brand/30 transition-shadow tap-target"
        >
          <div>
            <p className="font-semibold text-sm">Pay rent</p>
            <p className="text-xs text-gray-500">MoMo, Airtel, or notify landlord</p>
          </div>
          <ArrowRight size={18} className="text-brand shrink-0" />
        </button>
        <button
          type="button"
          onClick={onMessages}
          className="card p-4 text-left flex items-center justify-between hover:ring-2 hover:ring-brand/30 transition-shadow tap-target"
        >
          <div>
            <p className="font-semibold text-sm">Contact landlord</p>
            <p className="text-xs text-gray-500">Questions about rent or lease</p>
          </div>
          <ArrowRight size={18} className="text-brand shrink-0" />
        </button>
      </div>
    </div>
  )
}
