import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TenantJoinPage from '../pages/JoinPage'
import { seedDemoUsers } from './auth'
import { GENERIC_AUTH_ERROR } from './portalAuth'

describe('owner login on tenant join route', () => {
  beforeEach(() => {
    localStorage.clear()
    seedDemoUsers()
  })

  it('rejects owner credentials with generic error', async () => {
    const onAuthSuccess = vi.fn()
    render(
      <TenantJoinPage initialCode="" units={[]} buildings={[]} onAuthSuccess={onAuthSuccess} />,
    )
    const tabs = screen.getAllByRole('button', { name: /^sign in$/i })
    fireEvent.click(tabs[0])
    fireEvent.change(screen.getByPlaceholderText('tenant@demo.com'), {
      target: { value: 'owner@demo.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('tenant123'), {
      target: { value: 'owner123' },
    })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(GENERIC_AUTH_ERROR)).toBeInTheDocument()
    }, { timeout: 2000 })
    expect(onAuthSuccess).not.toHaveBeenCalled()
  })
})
