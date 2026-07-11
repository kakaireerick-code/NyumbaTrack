import React, { useState, useEffect } from 'react'
import { Home, Eye, EyeOff, MessageCircle } from 'lucide-react'
import { seedDemoUsers, registerTenantAsync, login } from '../lib/auth'
import { validateInviteForRole } from '../lib/invites'
import { fetchCloudInvite } from '../lib/inviteCloud'
import { normalizeInviteCode } from '../lib/routing'
import { validatePortalSignIn, showDemoCredentials, GENERIC_AUTH_ERROR } from '../lib/portalAuth'
import { checkJoinRateLimit, recordJoinFailure, clearJoinFailures } from '../lib/joinRateLimit'
import { inputCls, btnPrimary } from '../lib/formStyles'

export default function TenantJoinPage({
  initialCode = '',
  units,
  buildings,
  onAuthSuccess,
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
    let cancelled = false
    const run = async () => {
      if (!inviteCode || inviteCode.length < 6) {
        setCodeHint('')
        return
      }
      const v = validateInviteForRole(inviteCode, 'tenant')
      if (v.ok) {
        const unit = units?.find((u) => u.id === v.invite.unitId)
        const building = buildings?.find((b) => b.id === v.invite.propertyId)
        if (!cancelled) {
          setCodeHint(
            unit
              ? `Code accepted — Unit ${unit.unitNumber}${building ? ` at ${building.name}` : ''}`
              : 'Code accepted',
          )
        }
        return
      }
      const cloud = await fetchCloudInvite(inviteCode, 'tenant')
      if (!cancelled) {
        if (cloud) {
          setCodeHint(
            `Code accepted — Unit ${cloud.unitNumber || 'assigned'}${cloud.buildingName ? ` at ${cloud.buildingName}` : ''}`,
          )
        } else {
          setCodeHint('')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [inviteCode, units, buildings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const limit = checkJoinRateLimit()
    if (!limit.ok) {
      setError(limit.error)
      return
    }
    setLoading(true)

    try {
      if (mode === 'signin') {
        const result = login(email, password)
        if (!result.ok) {
          recordJoinFailure()
          setError(GENERIC_AUTH_ERROR)
          return
        }
        const portalCheck = validatePortalSignIn('tenant', result.user?.role || '')
        if (!portalCheck.ok) {
          recordJoinFailure()
          setError(portalCheck.error)
          return
        }
        clearJoinFailures()
        onAuthSuccess(result.user)
      } else {
        const result = await registerTenantAsync(
          email,
          password,
          name,
          inviteCode,
          units || [],
          buildings || [],
        )
        if (!result.ok) {
          recordJoinFailure()
          setError(result.error || GENERIC_AUTH_ERROR)
          return
        }
        clearJoinFailures()
        onAuthSuccess(result.user, result.unit, result.invite)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-dark">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="text-brand" size={32} />
          <h1 className="text-2xl font-bold text-brand">Join as tenant</h1>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Use the invite code from your landlord to access your unit and lease.
        </p>

        <div className="flex rounded-lg border dark:border-gray-600 mb-6 overflow-hidden text-sm">
          {['register', 'signin'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className={`tap-target flex-1 py-3 font-medium ${
                mode === m
                  ? 'bg-brand text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {m === 'register' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Invite code</label>
                <input
                  className={`${inputCls} uppercase tracking-widest font-mono text-lg`}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
                  placeholder="KLA-7F2G"
                  required
                />
                {codeHint && (
                  <p className="text-xs mt-1 text-green-600">{codeHint}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={mode === 'signin' && showDemoCredentials() ? 'tenant@demo.com' : ''}
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
                placeholder={mode === 'signin' && showDemoCredentials() ? 'tenant123' : ''}
              />
              <button type="button" className="tap-target absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full ${btnPrimary} disabled:opacity-50`}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Join my unit'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <MessageCircle size={14} /> Questions about your rent? Message your landlord after you join.
          </p>
        </div>
      </div>
    </div>
  )
}
