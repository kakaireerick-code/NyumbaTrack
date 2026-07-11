import { describe, it, expect, beforeEach } from 'vitest'
import { getUsers, saveUsers, registerOwner } from './auth'

describe('login reset v8', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('wipes stored users once on first getUsers after deploy', () => {
    saveUsers([
      {
        id: 'u-old',
        email: 'old@test.com',
        passwordHash: 'x',
        name: 'Old User',
        role: 'property_owner',
        ownerId: 'u-old',
      },
    ])
    expect(getUsers()).toHaveLength(0)
  })

  it('does not wipe users on second getUsers call', () => {
    getUsers()
    const reg = registerOwner('fresh@test.com', 'secret12', 'Fresh Owner')
    expect(reg.ok).toBe(true)
    expect(getUsers().some((u) => u.email === 'fresh@test.com')).toBe(true)
    expect(getUsers()).toHaveLength(1)
  })
})
