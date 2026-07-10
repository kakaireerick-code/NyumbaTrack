import React, { useState } from 'react'
import { Modal } from './UI'
import { Icon } from './UI'
import { markTourComplete } from '../lib/rolePrompts'

export default function TourModal({ open, onClose, steps, role }) {
  const [step, setStep] = useState(0)

  if (!open || !steps?.length) return null

  const current = steps[step]
  const isLast = step >= steps.length - 1

  const finish = (skipped = false) => {
    markTourComplete(role)
    setStep(0)
    onClose(skipped)
  }

  return (
    <Modal open={open} onClose={() => finish(true)} title={`Welcome — Step ${step + 1} of ${steps.length}`} wide>
      <div className="text-center py-4">
        <Icon name={current.icon || 'HelpCircle'} size={48} className="mx-auto text-[#2d6a4f] mb-4" />
        <h3 className="text-xl font-bold mb-2">{current.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">{current.description}</p>
      </div>
      <div className="flex justify-center gap-1 mb-4">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i === step ? 'bg-[#2d6a4f]' : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <div className="flex gap-2 flex-wrap justify-between">
        <button type="button" onClick={() => finish(true)} className="px-4 py-2 text-sm text-gray-500 hover:underline">
          Skip tour
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded">
              Back
            </button>
          )}
          {!isLast ? (
            <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 bg-[#2d6a4f] text-white rounded">
              Next
            </button>
          ) : (
            <button type="button" onClick={() => finish(false)} className="px-4 py-2 bg-[#2d6a4f] text-white rounded">
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
