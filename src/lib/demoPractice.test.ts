import { describe, it, expect, beforeEach } from 'vitest'
import { ensureDemoPracticeData, isDemoPracticeSeeded } from './demoPractice'
import { getMessages } from './messages'
import { getNotifications } from './notifications'

describe('demoPractice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds sample messages and notifications once per owner', () => {
    const ownerId = 'u-owner-demo'
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(true)
    expect(isDemoPracticeSeeded(ownerId)).toBe(true)
    expect(getMessages().length).toBeGreaterThan(0)
    expect(getNotifications().some((n) => n.title.startsWith('Practice:'))).toBe(true)
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(false)
  })
})
