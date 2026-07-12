import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingScreen, { LOADING_STATUS_LINES } from '../components/LoadingScreen'
import { APP_NAME } from '../lib/brand'

describe('LoadingScreen', () => {
  it(`renders ${APP_NAME} boot branding`, () => {
    render(<LoadingScreen />)
    expect(screen.getByText(APP_NAME)).toBeTruthy()
    expect(screen.getByText(/Smart rent management/i)).toBeTruthy()
    expect(screen.getByText('NT')).toBeTruthy()
    expect(screen.getByText(/Republic of Uganda/i)).toBeTruthy()
  })

  it('cycles status lines', () => {
    expect(LOADING_STATUS_LINES.length).toBeGreaterThan(0)
  })
})
