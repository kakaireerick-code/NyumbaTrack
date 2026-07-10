import React, { useState } from 'react'
import { Send } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getAssistantResponse, getSuggestedQuestions } from '../lib/assistant'
import { getPageGuidance } from '../lib/actionGuidance'

export default function AssistantPage({ currentRole, currentPage, demoMode, guidanceContext }) {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState([])

  const guidance = getPageGuidance(currentRole, 'assistant', { ...guidanceContext, demoMode })
  const suggestions = getSuggestedQuestions(currentRole)

  const ask = (text) => {
    const q = text || query
    if (!q.trim()) return
    const answer = getAssistantResponse(q, { role: currentRole, currentPage, demoMode })
    setHistory((prev) => [...prev, { q, a: answer }])
    setQuery('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Ask Assistant</h1>
      <p className="text-sm text-gray-500">Plain answers about rent, payments, and how to use NyumbaTrack.</p>
      <GuidancePanel guidance={guidance} />

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="text-xs px-3 py-1.5 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2.5"
          placeholder="e.g. How do I add a unit?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <button type="button" onClick={() => ask()} className="px-4 py-2 bg-[#2d6a4f] text-white rounded-lg">
          <Send size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item, i) => (
          <div key={`${item.q}-${i}`} className="card p-3 text-sm">
            <p className="font-medium text-gray-500">You: {item.q}</p>
            <p className="mt-2">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
