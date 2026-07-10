import React, { useState, useEffect } from 'react'
import { Home, Eye, EyeOff } from 'lucide-react'
import { seedDemoUsers, registerOwner, registerTenant, login, loginOrRegisterWithGoogle } from '../lib/auth'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { ROLE_LOGIN_HINTS } from '../lib/rolePrompts'

export default function LoginPage({ onAuthSuccess, units }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    seedDemoUsers()
  }, [])

  const handleGoogle = (profile) => {
    setError('')
    const role = mode === 'register-tenant' ? 'tenant' : 'property_owner'
    const result = loginOrRegisterWithGoogle(profile, role)
    if (!result.ok) {
      setError(result.error || 'Google sign-in failed')
      return
    }
    onAuthSuccess(result.user)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (mode === 'signin') {
        const result = login(email, password)
        if (!result.ok) {
          setError(result.error || 'Login failed')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user)
      } else if (mode === 'register-owner') {
        const result = registerOwner(email, password, name)
        if (!result.ok) {
          setError(result.error || 'Registration failed')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user)
      } else if (mode === 'register-tenant') {
        const result = registerTenant(email, password, name, inviteCode, units || [])
        if (!result.ok) {
          setError(result.error || 'Registration failed')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user, result.unit)
      }
      setLoading(false)
    }, 300)
  }

  const showGoogle = mode === 'signin' || mode === 'register-owner'

  const roleHintKey = mode === 'register-tenant' ? 'tenant' : mode === 'register-owner' ? 'property_owner' : 'property_owner'
  const roleHint = ROLE_LOGIN_HINTS[roleHintKey] || ''

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#1a1a2e' }}>
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="text-[#2d6a4f]" size={32} />
          <h1 className="text-2xl font-bold text-[#2d6a4f]">NyumbaTrack</h1>
        </div>
        <p className="text-center text-gray-500 mb-4">Property owners: sign in with Google for invoices & billing</p>

        <div className="flex rounded-lg border mb-6 overflow-hidden text-sm">
          {['signin', 'register-owner', 'register-tenant'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 px-1 ${mode === m ? 'bg-[#2d6a4f] text-white' : 'bg-gray-50 text-gray-600'}`}
            >
              {m === 'signin' ? 'Sign In' : m === 'register-owner' ? 'Owner' : 'Tenant'}
            </button>
          ))}
        </div>

        {roleHint && (
          <p className="text-sm text-center text-[#2d6a4f] bg-green-50 rounded p-2 mb-4">{roleHint}</p>
        )}

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

        {showGoogle && (
          <div className="mb-4 space-y-3">
            <GoogleSignInButton
              label={mode === 'register-owner' ? 'Register with Google' : 'Sign in with Google'}
              onSuccess={handleGoogle}
              onError={(msg) => setError(msg)}
            />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex-1 border-t" />
              or use email
              <span className="flex-1 border-t" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'signin' && (
            <div>
              <label className="block text-sm font-medium mb-1">Full name</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={mode === 'signin' ? 'owner@demo.com' : ''} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full border rounded px-3 py-2 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === 'signin' ? 'owner123' : ''}
              />
              <button type="button" className="absolute right-2 top-2.5 text-gray-400" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'register-tenant' && (
            <div>
              <label className="block text-sm font-medium mb-1">Invite code (from landlord)</label>
              <input
                className="w-full border rounded px-3 py-2 uppercase tracking-widest font-mono"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Free for tenants — no payment required</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded text-white font-medium disabled:opacity-50"
            style={{ background: '#2d6a4f' }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In with Email' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Owners: Google recommended for subscription invoices · Demo: owner@demo.com / owner123
        </p>
      </div>
    </div>
  )
}
