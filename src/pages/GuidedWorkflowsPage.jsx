import React, { useState } from 'react'
import GuidancePanel from '../components/GuidancePanel'
import GuidedWorkflowPanel from '../components/GuidedWorkflowPanel'
import { workflowsForRole } from '../lib/guidedWorkflows'
import { getPageGuidance } from '../lib/actionGuidance'

export default function GuidedWorkflowsPage({ currentRole, setCurrentPage, guidanceContext }) {
  const workflows = workflowsForRole(currentRole)
  const [activeId, setActiveId] = useState(null)
  const active = workflows.find((w) => w.id === activeId)

  const guidance = getPageGuidance(currentRole, 'guided', guidanceContext || {})

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <h1 className="text-2xl font-bold">Guided workflows</h1>
      <p className="text-gray-500 text-sm">Follow these steps at your own pace. No need to call support.</p>
      <GuidancePanel guidance={guidance} />

      {active && (
        <GuidedWorkflowPanel
          workflow={active}
          setCurrentPage={setCurrentPage}
          onClose={() => setActiveId(null)}
        />
      )}

      <div className="grid gap-3">
        {workflows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActiveId(w.id)}
            className={`card p-4 text-left hover:ring-2 hover:ring-[#2d6a4f]/40 transition-all ${activeId === w.id ? 'ring-2 ring-[#2d6a4f]' : ''}`}
          >
            <h3 className="font-semibold">{w.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{w.description}</p>
            <span className="text-xs text-[#2d6a4f] mt-2 inline-block">{w.steps.length} steps → Start</span>
          </button>
        ))}
      </div>
    </div>
  )
}
