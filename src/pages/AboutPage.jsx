import React from 'react'
import { Home, Heart, Shield } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import ProductHighlights from '../components/ProductHighlights'
import { getPageGuidance } from '../lib/actionGuidance'
import { ROLE_LABELS } from '../lib/rolePrompts'
import { normalizeRole } from '../lib/permissions'

const OWNER_COPY = {
  title: 'About NyumbaTrack',
  intro:
    'NyumbaTrack helps property owners in Uganda manage rent, tenants, MoMo payments, and reminders in one simple place — without spreadsheets.',
  bullets: [
    'Add properties and units with different rent amounts',
    'Invite tenants and caretakers with secure codes',
    'Record payments, send receipts, and track arrears privately',
    'Optional web push alerts and tenant messaging',
  ],
}

const TENANT_COPY = {
  title: 'About your tenant portal',
  intro:
    'Your landlord invited you here to see your unit, rent balance, lease, and messages — nothing else. Tenants never pay for NyumbaTrack.',
  bullets: [
    'Home shows what you owe for your unit only',
    'Pay tab explains how to send MoMo to your landlord',
    'Messages let you ask rent or repair questions safely',
    'Help and Ask Assistant answer common questions',
  ],
}

const CARETAKER_COPY = {
  title: 'About caretaker access',
  intro:
    'Your property owner invited you to help with units, vacancy, and maintenance. You cannot see rent amounts or financial records.',
  bullets: [
    'View which units are occupied or vacant',
    'Log and update repair issues',
    'Look up tenant contact details when they call',
    'Use Help or Ask Assistant if you are unsure',
  ],
}

export default function AboutPage({ currentRole, setCurrentPage }) {
  const role = normalizeRole(currentRole)
  const guidance = getPageGuidance(currentRole, 'about', {})
  const copy =
    role === 'tenant' ? TENANT_COPY : role === 'caretaker' ? CARETAKER_COPY : OWNER_COPY

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 p-4">
      <div className="flex items-center gap-3">
        <Home className="text-brand" size={28} />
        <div>
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{ROLE_LABELS[role] || 'User'}</p>
        </div>
      </div>

      <GuidancePanel guidance={guidance} />

      <div className="card p-5 space-y-3">
        <p className="text-gray-700 dark:text-gray-300">{copy.intro}</p>
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {copy.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card p-4 flex gap-3">
          <Shield className="text-brand shrink-0" size={22} />
          <div>
            <p className="font-semibold text-sm">Private by role</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tenants, caretakers, and owners each see only what they need.
            </p>
          </div>
        </div>
        <div className="card p-4 flex gap-3">
          <Heart className="text-brand shrink-0" size={22} />
          <div>
            <p className="font-semibold text-sm">Built for Uganda</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              UGX, MoMo, LC1 notices, and local rent workflows out of the box.
            </p>
          </div>
        </div>
      </div>

      <ProductHighlights
        currentRole={currentRole}
        surface="about"
        setCurrentPage={setCurrentPage}
        title="More about NyumbaTrack"
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCurrentPage('help')} className="px-4 py-2 border rounded-lg text-sm">
          Open Help
        </button>
        <button type="button" onClick={() => setCurrentPage('assistant')} className="px-4 py-2 bg-brand text-white rounded-lg text-sm">
          Ask Assistant
        </button>
        {role === 'property_owner' && (
          <button type="button" onClick={() => setCurrentPage('referrals')} className="px-4 py-2 border border-brand text-brand rounded-lg text-sm">
            Partner Rewards
          </button>
        )}
      </div>
    </div>
  )
}
