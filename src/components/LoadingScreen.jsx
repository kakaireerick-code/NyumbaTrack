import React, { useEffect, useState } from 'react'
import { Home } from 'lucide-react'
import { APP_NAME } from '../lib/brand'

export const LOADING_STATUS_LINES = [
  'Loading your portfolio…',
  'Preparing rent ledger…',
  'Syncing tenant records…',
  'Checking MoMo payment tools…',
  'Almost ready…',
]

export default function LoadingScreen({ fading = false }) {
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % LOADING_STATUS_LINES.length)
    }, 900)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={`nt-loading-screen${fading ? ' nt-loading-screen--out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${APP_NAME}`}
    >
      <div className="nt-loading-stripes" aria-hidden="true">
        <span className="nt-loading-stripe nt-loading-stripe--black" />
        <span className="nt-loading-stripe nt-loading-stripe--yellow" />
        <span className="nt-loading-stripe nt-loading-stripe--red" />
      </div>

      <div className="nt-loading-body">
        <div className="nt-loading-emblem-wrap">
          <span className="nt-loading-ring nt-loading-ring--outer" />
          <span className="nt-loading-ring nt-loading-ring--inner" />
          <div className="nt-loading-emblem">
            <Home size={36} strokeWidth={2.2} className="text-white" />
          </div>
        </div>

        <h1 className="nt-loading-title">{APP_NAME}</h1>
        <p className="nt-loading-subtitle">Smart rent management for Ugandan landlords</p>
        <span className="nt-loading-badge">NT</span>

        <div className="nt-loading-progress-track" aria-hidden="true">
          <div className="nt-loading-progress-bar" />
        </div>

        <p className="nt-loading-status">{LOADING_STATUS_LINES[lineIdx]}</p>
      </div>

      <footer className="nt-loading-footer">
        Republic of Uganda · MoMo-ready · Tenants use free
      </footer>
    </div>
  )
}
