import { describe, it, expect } from 'vitest'
import { parseEntryPath } from './routing'

describe('routing', () => {
  it('parses tenant join URLs', () => {
    const entry = parseEntryPath('/join/tenant/KLA-7F2G')
    expect(entry.kind).toBe('join-tenant')
    expect(entry.inviteCode).toBe('KLA-7F2G')
  })

  it('parses caretaker join URLs separately', () => {
    const entry = parseEntryPath('/join/caretaker/CTR-7F2G')
    expect(entry.kind).toBe('join-caretaker')
    expect(entry.inviteCode).toBe('CTR-7F2G')
  })

  it('parses billing admin deep link', () => {
    expect(parseEntryPath('/billing-admin').kind).toBe('billing-admin')
    expect(parseEntryPath('/billing-admin/').kind).toBe('billing-admin')
  })

  it('parses owner login routes', () => {
    expect(parseEntryPath('/login').kind).toBe('owner-login')
    expect(parseEntryPath('/owner').kind).toBe('owner-login')
    expect(parseEntryPath('/owner/signup').kind).toBe('owner-signup')
  })

  it('parses receipt routes', () => {
    expect(parseEntryPath('/receipt/RCT-2026-001').receiptId).toBe('RCT-2026-001')
    expect(parseEntryPath('/tenant/receipts/RCT-2026-001').receiptId).toBe('RCT-2026-001')
  })
})
