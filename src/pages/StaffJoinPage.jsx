import React, { useState, useEffect } from 'react'
import { Wrench, Eye, EyeOff } from 'lucide-react'
import { seedDemoUsers, registerCaretakerAsync, login } from '../lib/auth'
import { validateInviteForRole } from '../lib/invites'
import { fetchCloudInvite } from '../lib/inviteCloud'
import { normalizeInviteCode } from '../lib/routing'
import { validatePortalSignIn, showDemoCredentials, GENERIC_AUTH_ERROR } from '../lib/portalAuth'
import { checkJoinRateLimit, recordJoinFailure, clearJoinFailures } from '../lib/joinRateLimit'

export default function CaretakerJoinPage({ initialCode = '', onAuthSuccess }) {
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
      const v = validateInviteForRole(inviteCode, 'caretaker')
      if (v.ok) {
        if (!cancelled) setCodeHint('Code accepted')
        return
      }
      const cloud = await fetchCloudInvite(inviteCode, 'caretaker')
      if (!cancelled) setCodeHint(cloud ? 'Code accepted' : '')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [inviteCode])

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
        const portalCheck = validatePortalSignIn('caretaker', result.user?.role || '')
        if (!portalCheck.ok) {
          recordJoinFailure()
          setError(portalCheck.error)
          return
        }
        clearJoinFailures()
        onAuthSuccess(result.user)
      } else {
        const result = await registerCaretakerAsync(email, password, name, inviteCode)
        if (!result.ok) {
          recordJoinFailure()
          setError(result.error || GENERIC_AUTH_ERROR)
          return
        }
        clearJoinFailures()
        onAuthSuccess(result.user)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#2a2418' }}>
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench className="text-orange-600" size={32} />
          <h1 className="text-2xl font-bold text-orange-700">Join as caretaker</h1>
        </div>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Use the invite code from your property owner to manage units and maintenance.
        </p>

        <div className="flex rounded-lg border mb-6 overflow-hidden text-sm">
          {['register', 'signin'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 ${mode === m ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-600'}`}
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
                <label className="block text-sm font-medium mb-1">Invite code</label>
                <input
                  className="w-full border rounded px-3 py-2 uppercase tracking-widest font-mono text-lg"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
                  placeholder="CTR-7F2G"
                  required
                />
                {codeHint && <p className="text-xs mt-1 text-green-600">{codeHint}</p>}
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
              placeholder={mode === 'signin' && showDemoCredentials() ? 'keeper@demo.com' : ''}
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
                placeholder={mode === 'signin' && showDemoCredentials() ? 'keeper123' : ''}
              />
              <button type="button" className="absolute right-2 top-2.5 text-gray-400" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded text-white font-medium disabled:opacity-50 bg-orange-600"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
