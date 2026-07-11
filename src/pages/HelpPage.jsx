import React from 'react'
import GuidancePanel from '../components/GuidancePanel'
import ProductHighlights from '../components/ProductHighlights'
import { getPageGuidance } from '../lib/actionGuidance'
import { ROLE_HELP_GETTING_STARTED, ROLE_MANUALS } from '../data/roleManuals'
import { resetTour, ROLE_LABELS } from '../lib/rolePrompts'
import { normalizeRole } from '../lib/permissions'

export default function HelpPage({ currentRole, setCurrentPage, onRestartTour, showToast }) {
  const role = normalizeRole(currentRole)
  const gettingStarted = ROLE_HELP_GETTING_STARTED[role] || ROLE_HELP_GETTING_STARTED.property_owner
  const manual = ROLE_MANUALS[role] || ROLE_MANUALS.property_owner

  const guidance = getPageGuidance(currentRole, 'help', {})

  const handleRestartTour = () => {
    resetTour(role)
    onRestartTour?.()
    showToast?.('Tour will start again on next login — or tap below.', 'success')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">Help — {ROLE_LABELS[role] || 'User'}</h1>
      <GuidancePanel guidance={guidance} />

      <ProductHighlights
        currentRole={currentRole}
        surface="help"
        setCurrentPage={setCurrentPage}
        title="Quick facts"
      />

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Getting started</h2>
        <pre className="text-sm whitespace-pre-wrap font-sans text-gray-600 dark:text-gray-300">{gettingStarted}</pre>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Full manual</h2>
        <pre className="text-sm whitespace-pre-wrap font-sans text-gray-600 dark:text-gray-300 max-h-96 overflow-y-auto">{manual}</pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleRestartTour} className="px-4 py-2 border rounded">
          Restart welcome tour
        </button>
        <button type="button" onClick={() => setCurrentPage('guided')} className="px-4 py-2 bg-[#2d6a4f] text-white rounded">
          Guided workflows
        </button>
        <button type="button" onClick={() => setCurrentPage('assistant')} className="px-4 py-2 border rounded">
          Ask assistant
        </button>
      </div>
    </div>
  )
}
