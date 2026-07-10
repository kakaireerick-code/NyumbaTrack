/** Path-based entry without react-router — read once on load */

export type AppEntry = {
  entry: 'owner' | 'join' | 'staff-join'
  inviteCode: string
}

export const normalizeInviteCode = (code: string): string =>
  String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

export const parseEntryPath = (pathname = window.location.pathname): AppEntry => {
  const path = (pathname || '/').replace(/\/$/, '') || '/'
  if (path === '/staff/join') return { entry: 'staff-join', inviteCode: '' }
  if (path.startsWith('/staff/join/')) {
    const raw = path.slice('/staff/join/'.length)
    return { entry: 'staff-join', inviteCode: normalizeInviteCode(decodeURIComponent(raw)) }
  }
  if (path === '/join') return { entry: 'join', inviteCode: '' }
  if (path.startsWith('/join/')) {
    const raw = path.slice('/join/'.length)
    return { entry: 'join', inviteCode: normalizeInviteCode(decodeURIComponent(raw)) }
  }
  return { entry: 'owner', inviteCode: '' }
}

export const getJoinPath = (code?: string): string =>
  code ? `/join/${encodeURIComponent(normalizeInviteCode(code))}` : '/join'

export const getStaffJoinPath = (code?: string): string =>
  code ? `/staff/join/${encodeURIComponent(normalizeInviteCode(code))}` : '/staff/join'
