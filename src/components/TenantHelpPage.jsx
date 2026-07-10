import React from 'react'

const FAQ = [
  {
    q: 'How do I pay my rent?',
    a: 'Use the payment numbers shown on your Home screen — MTN MoMo or Airtel Money. Always include your unit number as the payment reference.',
  },
  {
    q: 'When is rent due?',
    a: 'Your due date is shown on the Home tab. Pay before that date to avoid late reminders.',
  },
  {
    q: 'I paid but my balance still shows arrears',
    a: 'Payments can take a few hours to reflect. If you paid today, tap "I paid" on the Payments tab with your transaction reference. Your landlord will confirm.',
  },
  {
    q: 'Who do I contact for repairs?',
    a: 'Call the caretaker number on your Lease tab, or message your landlord using the contact details there.',
  },
  {
    q: 'Is this app free for tenants?',
    a: 'Yes. Tenants use NyumbaTrack at no cost. Your landlord manages the property; you only see your own unit.',
  },
]

export default function TenantHelpPage() {
  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold">Help</h1>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        Quick answers to common questions. No jargon — just what you need.
      </p>
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="card p-4 group">
            <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
              {item.q}
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
