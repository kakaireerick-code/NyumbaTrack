import React, { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { getStoredTheme } from '../lib/theme'

function decodeGoogleJwt(credential) {
  const payload = credential.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

function DemoGoogleSignIn({ onSuccess, label = 'Sign in with Google', dark = false }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    onSuccess({
      sub: `demo-google-${email}`,
      email: email.trim().toLowerCase(),
      name: name.trim() || email.split('@')[0],
      picture: '',
    })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium ${
          dark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-600'
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {label}
        <span className="text-xs text-gray-400">(demo)</span>
      </button>
    )
  }

  return (
    <form onSubmit={submit} className={`p-3 border rounded-lg space-y-2 text-sm ${dark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50'}`}>
      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Demo Google sign-in — use your Gmail. Set VITE_GOOGLE_CLIENT_ID for real OAuth.</p>
      <input className="w-full border rounded px-2 py-1.5" placeholder="your@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full border rounded px-2 py-1.5" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="flex-1 py-1.5 border rounded" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="flex-1 py-1.5 bg-[#2d6a4f] text-white rounded">Continue</button>
      </div>
    </form>
  )
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = 'Sign in with Google',
  theme = 'light',
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const dark = theme === 'dark'

  if (!clientId) {
    return <DemoGoogleSignIn onSuccess={onSuccess} label={label} dark={dark} />
  }

  return (
    <div className="w-full flex justify-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={(res) => {
          if (!res.credential) {
            onError?.('Google sign-in failed')
            return
          }
          try {
            const profile = decodeGoogleJwt(res.credential)
            onSuccess({
              sub: profile.sub,
              email: profile.email,
              name: profile.name,
              picture: profile.picture,
            })
          } catch {
            onError?.('Could not read Google profile')
          }
        }}
        onError={() => onError?.('Google sign-in was cancelled or failed')}
        theme={dark ? 'filled_black' : 'outline'}
        size="large"
        text="continue_with"
        shape="rectangular"
        width="380"
      />
    </div>
  )
}
