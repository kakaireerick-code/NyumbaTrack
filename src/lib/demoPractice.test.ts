import { describe, it, expect, beforeEach } from 'vitest'
import { ensureDemoPracticeData, isDemoPracticeSeeded, purgeDemoPracticeData } from './demoPractice'
import { getMessages } from './messages'
import { getNotifications } from './notifications'

describe('demoPractice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds sample messages and notifications once per owner when demo is on', () => {
    const ownerId = 'u-owner-demo'
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(true)
    expect(isDemoPracticeSeeded(ownerId)).toBe(true)
    expect(getMessages().length).toBeGreaterThan(0)
    expect(getNotifications().some((n) => n.title.startsWith('Practice:'))).toBe(true)
    expect(ensureDemoPracticeData(ownerId, { demoMode: true })).toBe(false)
  })

  it('does not seed when demo mode is off', () => {
    const ownerId = 'u-owner-live'
    expect(ensureDemoPracticeData(ownerId, { demoMode: false })).toBe(false)
    expect(getMessages()).toHaveLength(0)
    expect(getNotifications()).toHaveLength(0)
  })

  it('purges practice messages and notifications for owner', () => {
    const ownerId = 'u-owner-demo'
    ensureDemoPracticeData(ownerId, { demoMode: true })
    expect(getMessages().length).toBeGreaterThan(0)
    expect(getNotifications().some((n) => n.title.startsWith('Practice:'))).toBe(true)
    purgeDemoPracticeData(ownerId)
    expect(getMessages().filter((m) => m.ownerId === ownerId)).toHaveLength(0)
    expect(getNotifications().filter((n) => n.ownerId === ownerId && n.title.startsWith('Practice:'))).toHaveLength(0)
    expect(isDemoPracticeSeeded(ownerId)).toBe(false)
  })
})
