import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import { registerServiceWorker } from './lib/pushClient'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const MIN_BOOT_MS = 1600
const FADE_MS = 500

if (typeof window !== 'undefined') {
  void registerServiceWorker()
}

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p)
    this.state = { error: null }
  }

  componentDidCatch(e) {
    this.setState({ error: e.message })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Error:</h2>
          <p>{this.state.error}</p>
          <button type="button" onClick={() => this.setState({ error: null })}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const hideHtmlSplash = () => {
  const splash = document.getElementById('nt-splash')
  if (splash) splash.classList.add('nt-splash--hide')
  window.setTimeout(() => splash?.remove(), FADE_MS + 100)
}

function AppRoot() {
  const [phase, setPhase] = useState('loading')

  useEffect(() => {
    const started = performance.now()
    const finish = () => {
      const wait = Math.max(0, MIN_BOOT_MS - (performance.now() - started))
      window.setTimeout(() => {
        hideHtmlSplash()
        setPhase('fading')
        window.setTimeout(() => setPhase('app'), FADE_MS)
      }, wait)
    }
    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
  }, [])

  if (phase === 'app') {
    return (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    )
  }

  return <LoadingScreen fading={phase === 'fading'} />
}

const tree = (
  <StrictMode>
    <AppRoot />
  </StrictMode>
)

createRoot(document.getElementById('root')).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  ) : (
    tree
  ),
)
