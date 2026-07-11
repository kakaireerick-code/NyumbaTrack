import React from 'react'
import * as Icons from 'lucide-react'

export function Icon({ name, size = 20, className = '' }) {
  const LucideIcon = Icons[name]
  if (!LucideIcon) return null
  return <LucideIcon size={size} className={className} />
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    darkred: 'bg-red-900 text-white',
  }
  return <span className={`badge ${colors[color] || colors.gray}`}>{children}</span>
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className={`card p-4 sm:p-6 max-h-[90vh] overflow-y-auto w-[95%] ${wide ? 'max-w-3xl' : 'max-w-lg'} dark:bg-gray-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ label, value, color = '#2d6a4f' }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )
}

export function EmptyState({ message }) {
  return (
    <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
      <p>{message}</p>
    </div>
  )
}

export function LoadingButton({ loading, children, className = '', type = 'button', ...props }) {
  return (
    <button type={type} disabled={loading} className={`${className} disabled:opacity-50`} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  )
}

export function ProgressBar({ pct, color }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
      <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}
