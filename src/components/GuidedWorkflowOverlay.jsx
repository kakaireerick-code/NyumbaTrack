import React, { useState } from 'react'
import { Play, X, ChevronRight } from 'lucide-react'

/** Floating guided workflow overlay — visible on any owner page while a workflow runs */
export default function GuidedWorkflowOverlay({ workflow, setCurrentPage, onClose }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [minimized, setMinimized] = useState(false)

  if (!workflow) return null

  const step = workflow.steps[stepIdx]
  const isLast = stepIdx >= workflow.steps.length - 1

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 right-4 z-50 px-4 py-2 bg-[#2d6a4f] text-white rounded-full shadow-lg text-sm flex items-center gap-2"
      >
        <Play size={16} /> {workflow.title}
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] card p-4 shadow-xl border-2 border-[#2d6a4f]/40 no-print">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <p className="text-xs text-[#2d6a4f] font-medium uppercase tracking-wide">Guided workflow</p>
          <h3 className="font-bold text-sm">{workflow.title}</h3>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setMinimized(true)} className="text-gray-400 text-xs px-1">—</button>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-1">Step {stepIdx + 1} of {workflow.steps.length}</p>
      <h4 className="font-semibold text-sm">{step?.title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{step?.instructions}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => step?.targetPage && setCurrentPage(step.targetPage)}
          className="px-3 py-1.5 bg-[#2d6a4f] text-white rounded text-xs flex items-center gap-1"
        >
          Open page <ChevronRight size={12} />
        </button>
        {!isLast ? (
          <button type="button" onClick={() => setStepIdx(stepIdx + 1)} className="px-3 py-1.5 border rounded text-xs">
            Next
          </button>
        ) : (
          <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded text-xs text-green-700">
            Done
          </button>
        )}
        {stepIdx > 0 && (
          <button type="button" onClick={() => setStepIdx(stepIdx - 1)} className="px-2 py-1.5 text-xs text-gray-500">
            Back
          </button>
        )}
      </div>
    </div>
  )
}
