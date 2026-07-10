import React from 'react'
import { DATA_QUALITY_LABELS } from '../lib/tenantData'

const COLORS = {
  complete: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  minimal: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

export default function DataQualityBadge({ quality }) {
  if (!quality) return null
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${COLORS[quality] || COLORS.minimal}`}>
      {DATA_QUALITY_LABELS[quality] || quality}
    </span>
  )
}
