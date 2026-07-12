import React, { useState, useEffect } from 'react'
import { Home, Eye, EyeOff } from 'lucide-react'
import { seedDemoUsers, registerOwner, login, loginOrRegisterWithGoogle } from '../lib/auth'
import { captureReferralFromUrl } from '../lib/partnerRewards'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { isOwnerLoginRole } from '../lib/permissions'
import { validatePortalSignIn, showDemoCredentials, GENERIC_AUTH_ERROR } from '../lib/portalAuth'
import { isDeployedApp } from '../lib/environment'
import { getBuildInfo } from '../lib/buildInfo'
import { getStoredTheme } from '../lib/theme'
import { inputCls, btnPrimary } from '../lib/formStyles'
import ProductHighlights from '../components/ProductHighlights'

export default function LoginPage({ onAuthSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'register-owner' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginTheme = getStoredTheme()
  const isRegister = mode === 'register-owner'

  useEffect(() => {
    seedDemoUsers()
    captureReferralFromUrl()
  }, [])

  const handleGoogle = (profile) => {
    setError('')
    const result = loginOrRegisterWithGoogle(profile, 'property_owner')
    if (!result.ok) {
      setError(result.error || 'Google sign-in failed')
      return
    }
    if (!isOwnerLoginRole(result.user?.role || '')) {
      setError(GENERIC_AUTH_ERROR)
      return
    }
    const portalCheck = validatePortalSignIn('owner', result.user?.role || '')
    if (!portalCheck.ok) {
      setError(portalCheck.error)
      return
    }
    onAuthSuccess(result.user, null, null, { isNew: !!result.isNew })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (mode === 'signin') {
        const result = login(email, password)
        if (!result.ok) {
          setError(GENERIC_AUTH_ERROR)
          setLoading(false)
          return
        }
        if (!isOwnerLoginRole(result.user?.role || '')) {
          setError(GENERIC_AUTH_ERROR)
          setLoading(false)
          return
        }
        const portalCheck = validatePortalSignIn('owner', result.user?.role || '')
        if (!portalCheck.ok) {
          setError(portalCheck.error)
          setLoading(false)
          return
        }
        onAuthSuccess(result.user)
      } else {
        const result = registerOwner(email, password, name)
        if (!result.ok) {
          setError(result.error || 'Registration failed')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user, null, null, { isNew: true })
      }
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-dark">
      {isDeployedApp() && (
        <p className="fixed bottom-2 right-3 text-[10px] text-white/40 opacity-70 select-all" title="Deployment build ID">
          build {getBuildInfo().sha}
        </p>
      )}
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="text-brand" size={32} />
          <h1 className="text-2xl font-bold text-brand">NyumbaTrack</h1>
        </div>
        <h2 className="text-center text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-4 text-sm">
          {isRegister ? 'Start managing your properties in minutes' : 'Sign in to manage your properties'}
        </p>

        <div className="flex rounded-lg border dark:border-gray-600 mb-6 overflow-hidden text-sm">
          {['signin', 'register-owner'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className={`tap-target flex-1 py-3 px-1 font-medium ${
                mode === m
                  ? 'bg-brand text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Create account'}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>}

        <div className="mb-4 space-y-3">
          <GoogleSignInButton
            label={isRegister ? 'Register with Google' : 'Sign in with Google'}
            theme={loginTheme}
            onSuccess={handleGoogle}
            onError={(msg) => setError(msg)}
          />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex-1 border-t dark:border-gray-600" />
            or use email
            <span className="flex-1 border-t dark:border-gray-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={mode === 'signin' && showDemoCredentials() ? 'owner@demo.com' : ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className={`${inputCls} pr-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === 'signin' && showDemoCredentials() ? 'owner123' : ''}
              />
              <button type="button" className="tap-target absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full ${btnPrimary} disabled:opacity-50`}>
            {loading ? 'Please wait...' : isRegister ? 'Create owner account' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          {showDemoCredentials() ? 'Demo owner: owner@demo.com / owner123' : 'Property owner access only'}
        </p>

        <ProductHighlights currentRole="property_owner" surface="login" variant="login" maxItems={4} />
      </div>
    </div>
  )
}
