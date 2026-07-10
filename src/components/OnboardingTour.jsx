import React, { useState } from 'react'
import { Modal } from './UI'
import { safeSet } from '../lib/storage.ts'

const STEPS = [
  { title: 'Add Your Building', text: 'Start by adding your property under Buildings.' },
  { title: 'Add Your Units', text: 'Create a unit for each rentable room or apartment.' },
  { title: 'Add Your Tenants', text: 'Assign tenants to occupied units with their KYC details.' },
  { title: 'Record Payments', text: 'Log rent payments manually or reconcile from MoMo CSV.' },
]

export const shouldShowTour = () => {
  try {
    const raw = localStorage.getItem('renttrack_tour_seen')
    if (raw === null) return true
    return JSON.parse(raw) !== true
  } catch {
    return true
  }
}

export const markTourSeen = () => safeSet('renttrack_tour_seen', true)

export default function OnboardingTour({ open, onClose }) {
  const [step, setStep] = useState(0)

  const finish = () => {
    markTourSeen()
    onClose()
  }

  return (
    <Modal open={open} onClose={finish} title={`Welcome to NyumbaTrack — Step ${step + 1} of 4`}>
      <h3 className="font-semibold text-lg mb-2">{STEPS[step].title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{STEPS[step].text}</p>
      <div className="flex gap-2 flex-wrap">
        {step < 3 ? (
          <>
            <button type="button" onClick={finish} className="px-4 py-2 border rounded">Skip Tour</button>
            <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 bg-[#2d6a4f] text-white rounded ml-auto">
              Next
            </button>
          </>
        ) : (
          <button type="button" onClick={finish} className="px-4 py-2 bg-[#2d6a4f] text-white rounded w-full sm:w-auto">
            Get Started
          </button>
        )}
      </div>
    </Modal>
  )
}
