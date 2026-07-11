import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingScreen, { LOADING_STATUS_LINES } from '../components/LoadingScreen'

describe('LoadingScreen', () => {
  it('renders NyumbaTrack boot branding', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('NyumbaTrack')).toBeTruthy()
    expect(screen.getByText(/Smart rent management/i)).toBeTruthy()
    expect(screen.getByText('NT')).toBeTruthy()
    expect(screen.getByText(/Republic of Uganda/i)).toBeTruthy()
  })

  it('exposes rotating status lines', () => {
    expect(LOADING_STATUS_LINES.length).toBeGreaterThanOrEqual(3)
    expect(LOADING_STATUS_LINES[0]).toMatch(/portfolio/i)
  })
})
