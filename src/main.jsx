import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './lib/pushClient'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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

const root = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

createRoot(document.getElementById('root')).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{root}</GoogleOAuthProvider>
  ) : (
    root
  ),
)
