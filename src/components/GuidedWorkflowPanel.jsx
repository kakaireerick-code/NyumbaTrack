import React, { useState } from 'react'
import { Play, ChevronRight } from 'lucide-react'

export default function GuidedWorkflowPanel({ workflow, setCurrentPage, onClose }) {
  const [stepIdx, setStepIdx] = useState(0)

  if (!workflow) return null

  const step = workflow.steps[stepIdx]
  const isLast = stepIdx >= workflow.steps.length - 1

  const goToPage = () => {
    if (step?.targetPage) setCurrentPage(step.targetPage)
  }

  return (
    <div className="card p-4 border-2 border-[#2d6a4f]/30">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Play size={18} className="text-[#2d6a4f]" />
            {workflow.title}
          </h3>
          <p className="text-sm text-gray-500">{workflow.description}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2">Step {stepIdx + 1} of {workflow.steps.length}</p>
      <h4 className="font-semibold">{step?.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{step?.instructions}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={goToPage} className="px-3 py-2 bg-[#2d6a4f] text-white rounded text-sm flex items-center gap-1">
          Open page <ChevronRight size={14} />
        </button>
        {!isLast ? (
          <button type="button" onClick={() => setStepIdx(stepIdx + 1)} className="px-3 py-2 border rounded text-sm">
            Next step
          </button>
        ) : (
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded text-sm text-green-700">
            Finish
          </button>
        )}
        {stepIdx > 0 && (
          <button type="button" onClick={() => setStepIdx(stepIdx - 1)} className="px-3 py-2 text-sm text-gray-500">
            Back
          </button>
        )}
      </div>
    </div>
  )
}
