import { normalizeRole } from './permissions'
import { FAQ_ENTRIES } from './assistantKnowledge'

export type AssistantResult = {
  answer: string
  offerPage?: string
  offerPageId?: string
  offerWorkflowId?: string
}

export const getAssistantResponse = (
  query: string,
  ctx: { role: string; currentPage?: string; demoMode?: boolean },
): AssistantResult => {
  const q = query.trim().toLowerCase()
  if (!q) {
    return {
      answer: 'Type a question — for example: "How do I add a unit?" or "How do I pay rent?"',
    }
  }

  const role = normalizeRole(ctx.role)
  const matches = FAQ_ENTRIES.filter(
    (e) =>
      e.roles.includes(role) &&
      e.keywords.some((kw) => q.includes(kw) || kw.split(' ').every((w) => q.includes(w))),
  )

  const pick = matches[0] || FAQ_ENTRIES.filter(
    (e) =>
      e.roles.includes(role) &&
      e.keywords.some((kw) => kw.split(' ').some((w) => w.length >= 3 && q.includes(w))),
  )[0]

  if (pick) {
    return {
      answer: pick.answer,
      offerPage: pick.offerPage,
      offerPageId: pick.offerPageId,
      offerWorkflowId: pick.offerWorkflowId,
    }
  }

  if (role === 'tenant') {
    if (q.includes('owner') || q.includes('secret') || q.includes('other tenant')) {
      return {
        answer: 'That information is only for your landlord. You can see your own unit, payments, and lease only.',
      }
    }
    return {
      answer: 'I could not find an exact answer. Try Help → FAQ, or ask "how to pay rent" or "what do I owe".',
      offerPage: 'Help',
      offerPageId: 'help',
    }
  }

  if (ctx.demoMode && q.includes('real')) {
    return {
      answer: 'Turn off Demo Mode in the header to switch back to your live property data.',
    }
  }

  return {
    answer: 'Try asking about: adding a unit, invite codes, recording payments, inbox messages, or demo mode.',
    offerPage: 'Guided Steps',
    offerPageId: 'guided',
  }
}

export const getSuggestedQuestions = (role: string): string[] => {
  const r = normalizeRole(role)
  if (r === 'tenant') {
    return ['How do I pay rent?', 'What do I owe?', 'How do I use my invite code?', 'My balance looks wrong', 'Who do I contact?']
  }
  if (r === 'caretaker') {
    return ['How do I log maintenance?', 'What can I see?', 'Who do tenants call?']
  }
  return [
    'How do I add a unit?',
    'How do I invite a tenant?',
    'Where is my inbox?',
    'How do I record a payment?',
    'How does demo mode work?',
  ]
}
