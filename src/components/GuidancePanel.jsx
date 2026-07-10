import React from 'react'
import { Info, CheckCircle, AlertTriangle, Circle } from 'lucide-react'

const VARIANTS = {
  success: { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200', icon: CheckCircle, color: 'text-green-700' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200', icon: Info, color: 'text-blue-700' },
  warning: { bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200', icon: AlertTriangle, color: 'text-orange-700' },
  neutral: { bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200', icon: Circle, color: 'text-gray-700' },
}

export default function GuidancePanel({ guidance, onAction }) {
  if (!guidance) return null
  const v = VARIANTS[guidance.variant] || VARIANTS.neutral
  const Icon = v.icon

  return (
    <div className={`mb-4 p-4 rounded-lg border ${v.bg}`}>
      <div className="flex gap-3">
        <Icon className={`shrink-0 mt-0.5 ${v.color}`} size={20} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${v.color}`}>{guidance.headline}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{guidance.detail}</p>
          {guidance.nextSteps?.length > 0 && (
            <ul className="mt-2 text-xs text-gray-500 space-y-1 list-disc list-inside">
              {guidance.nextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {onAction && (
            <button type="button" onClick={onAction} className="mt-2 text-xs font-medium text-[#2d6a4f] underline">
              Take me there →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
