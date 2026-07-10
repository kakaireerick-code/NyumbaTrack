import React, { useState, useEffect } from 'react'
import { Home, Eye, EyeOff, MessageCircle } from 'lucide-react'
import { seedDemoUsers, registerTenant, login } from '../lib/auth'
import { validateInviteCode } from '../lib/invites'
import { ROLE_LOGIN_HINTS } from '../lib/rolePrompts'
import { normalizeInviteCode } from '../lib/routing'

export default function JoinPage({
  initialCode = '',
  units,
  buildings,
  onAuthSuccess,
  onGoOwnerLogin,
}) {
  const [mode, setMode] = useState('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState(normalizeInviteCode(initialCode))
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeHint, setCodeHint] = useState('')

  useEffect(() => {
    seedDemoUsers()
  }, [])

  useEffect(() => {
    if (initialCode) setInviteCode(normalizeInviteCode(initialCode))
  }, [initialCode])

  useEffect(() => {
    if (!inviteCode || inviteCode.length < 6) {
      setCodeHint('')
      return
    }
    const v = validateInviteCode(inviteCode)
    if (v.ok) {
      const unit = units?.find((u) => u.id === v.invite.unitId)
      const building = buildings?.find((b) => b.id === v.invite.propertyId)
      setCodeHint(
        unit
          ? `Code valid — Unit ${unit.unitNumber}${building ? ` at ${building.name}` : ''}`
          : 'Code valid',
      )
    } else {
      setCodeHint(v.error)
    }
  }, [inviteCode, units, buildings])

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
        if (result.user?.role !== 'tenant') {
          setError('This sign-in is for tenants only. Property owners should use the main login.')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user)
      } else {
        const result = registerTenant(email, password, name, inviteCode, units || [], buildings || [])
        if (!result.ok) {
          setError(result.error || 'Registration failed')
          setLoading(false)
          return
        }
        onAuthSuccess(result.user, result.unit, result.invite)
      }
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#1a2e1a' }}>
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="text-[#2d6a4f]" size={32} />
          <h1 className="text-2xl font-bold text-[#2d6a4f]">Tenant portal</h1>
        </div>
        <p className="text-center text-gray-500 mb-2 text-sm">
          Your landlord invited you here — free access to your unit, rent, and lease.
        </p>
        <p className="text-center text-xs text-gray-400 mb-4">
          {ROLE_LOGIN_HINTS.tenant}
        </p>

        <div className="flex rounded-lg border mb-6 overflow-hidden text-sm">
          {['register', 'signin'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 ${mode === m ? 'bg-[#2d6a4f] text-white' : 'bg-gray-50 text-gray-600'}`}
            >
              {m === 'register' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Invite code (from landlord)</label>
                <input
                  className="w-full border rounded px-3 py-2 uppercase tracking-widest font-mono text-lg"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
                  placeholder="KLA-7F2G"
                  required
                />
                {codeHint && (
                  <p className={`text-xs mt-1 ${codeHint.startsWith('Code valid') ? 'text-green-600' : 'text-orange-600'}`}>
                    {codeHint}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={mode === 'signin' ? 'tenant@demo.com' : ''}
            />
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
                placeholder={mode === 'signin' ? 'tenant123' : ''}
              />
              <button type="button" className="absolute right-2 top-2.5 text-gray-400" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded text-white font-medium disabled:opacity-50"
            style={{ background: '#2d6a4f' }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Join my unit'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center space-y-2">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <MessageCircle size={14} /> Wrong amount? You can message your landlord after you join.
          </p>
          {onGoOwnerLogin && (
            <button type="button" onClick={onGoOwnerLogin} className="text-xs text-gray-500 underline">
              Property owner? Sign in here
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
