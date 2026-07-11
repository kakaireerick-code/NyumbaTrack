import { describe, it, expect } from 'vitest'
import { getAssistantResponse } from './assistant'

describe('assistant navigation offers', () => {
  it('offers to open inbox for message questions', () => {
    const r = getAssistantResponse('where is my inbox', { role: 'property_owner' })
    expect(r.offerPageId).toBe('messages')
    expect(r.answer).toMatch(/inbox|messages/i)
  })

  it('offers workflow for invite questions', () => {
    const r = getAssistantResponse('how do I invite a tenant', { role: 'property_owner' })
    expect(r.offerPageId).toBe('settings')
    expect(r.offerWorkflowId).toBe('owner_invite_tenant')
  })

  it('offers help page for tenants when unsure', () => {
    const r = getAssistantResponse('something random xyz', { role: 'tenant' })
    expect(r.offerPageId).toBe('help')
  })
})
