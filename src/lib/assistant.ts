import { normalizeRole } from './permissions'
import { FAQ_ENTRIES } from './assistantKnowledge'

export const getAssistantResponse = (
  query: string,
  ctx: { role: string; currentPage?: string; demoMode?: boolean },
): string => {
  const q = query.trim().toLowerCase()
  if (!q) {
    return 'Type a question — for example: "How do I add a unit?" or "How do I pay rent?"'
  }

  const role = normalizeRole(ctx.role)
  const matches = FAQ_ENTRIES.filter(
    (e) =>
      e.roles.includes(role) &&
      e.keywords.some((kw) => q.includes(kw) || kw.split(' ').every((w) => q.includes(w))),
  )

  if (matches.length > 0) {
    return matches[0].answer
  }

  const loose = FAQ_ENTRIES.filter(
    (e) => e.roles.includes(role) && e.keywords.some((kw) => kw.split(' ').some((w) => q.includes(w))),
  )
  if (loose.length > 0) return loose[0].answer

  if (role === 'tenant') {
    if (q.includes('owner') || q.includes('secret') || q.includes('other tenant')) {
      return 'That information is only for your landlord. You can see your own unit, payments, and lease only.'
    }
    return 'I could not find an exact answer. Try Help → FAQ, or ask "how to pay rent" or "what do I owe". For urgent issues, call your landlord using the number on your Lease tab.'
  }

  if (ctx.demoMode && q.includes('real')) {
    return 'Turn off Demo Mode in the header to switch back to your live property data.'
  }

  return 'Try asking about: adding a unit, invite codes, recording payments, or what tenants can see. Open Guided Workflows for step-by-step help.'
}

export const getSuggestedQuestions = (role: string): string[] => {
  const r = normalizeRole(role)
  if (r === 'tenant') {
    return ['How do I pay rent?', 'What do I owe?', 'How do I use my invite code?', 'My balance looks wrong', 'Who do I contact?']
  }
  if (r === 'caretaker') {
    return ['How do I log maintenance?', 'What can I see?', 'Who do tenants call?']
  }
  return ['How do I add a unit?', 'How do I invite a tenant?', 'What can tenants see?', 'How do I record a payment?', 'How does subscription work?']
}
