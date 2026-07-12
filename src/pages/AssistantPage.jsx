import React, { useState } from 'react'
import { Send } from 'lucide-react'
import GuidancePanel from '../components/GuidancePanel'
import { getAssistantResponse, getSuggestedQuestions } from '../lib/assistant'
import { getPageGuidance } from '../lib/actionGuidance'
import { btnPrimary } from '../lib/formStyles'

export default function AssistantPage({
  currentRole,
  currentPage,
  demoMode,
  guidanceContext,
  setCurrentPage,
  onStartWorkflow,
}) {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState([])
  const [pendingNav, setPendingNav] = useState(null)

  const guidance = getPageGuidance(currentRole, 'assistant', { ...guidanceContext, demoMode })
  const suggestions = getSuggestedQuestions(currentRole)

  const ask = (text) => {
    const q = text || query
    if (!q.trim()) return
    const result = getAssistantResponse(q, { role: currentRole, currentPage, demoMode })
    setHistory((prev) => [...prev, { q, ...result }])
    setQuery('')
    if (result.offerPage && (result.offerPageId || result.offerWorkflowId)) {
      setPendingNav({
        label: result.offerPage,
        pageId: result.offerPageId,
        workflowId: result.offerWorkflowId,
      })
    } else {
      setPendingNav(null)
    }
  }

  const acceptNav = () => {
    if (!pendingNav) return
    if (pendingNav.workflowId && onStartWorkflow) {
      onStartWorkflow(pendingNav.workflowId)
    } else if (pendingNav.pageId && setCurrentPage) {
      setCurrentPage(pendingNav.pageId)
    }
    setPendingNav(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Ask Assistant</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Plain answers about rent, payments, and how to use Nyumba-track.</p>
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
          className="flex-1 border rounded-lg px-3 py-2.5 dark:bg-gray-800 dark:border-gray-600"
          placeholder="e.g. How do I add a unit?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <button type="button" onClick={() => ask()} className={`px-4 py-2 ${btnPrimary}`}>
          <Send size={18} />
        </button>
      </div>

      {pendingNav && (
        <div className="card p-3 text-sm border border-brand/30 bg-brand-muted/30 dark:bg-brand/10">
          <p className="mb-2">Would you like me to open <strong>{pendingNav.label}</strong>?</p>
          <div className="flex gap-2">
            <button type="button" onClick={acceptNav} className={`px-4 py-2 text-sm ${btnPrimary}`}>
              Yes, open it
            </button>
            <button type="button" onClick={() => setPendingNav(null)} className="px-4 py-2 text-sm border rounded-lg">
              Not now
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {history.map((item, i) => (
          <div key={`${item.q}-${i}`} className="card p-3 text-sm">
            <p className="font-medium text-gray-500 dark:text-gray-400">You: {item.q}</p>
            <p className="mt-2">{item.a || item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
