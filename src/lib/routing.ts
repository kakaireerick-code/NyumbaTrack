/** Path-based entry without react-router — read once on load */

import type { Role } from './permissions'

export type EntryKind = 'owner-login' | 'owner-signup' | 'join-tenant' | 'join-caretaker' | 'receipt' | 'notice' | 'billing-admin'

export type AppEntry = {
  kind: EntryKind
  inviteCode: string
  receiptId: string
  noticeId: string
}

export const normalizeInviteCode = (code: string): string =>
  String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

const stripTrailing = (path: string): string => (path || '/').replace(/\/$/, '') || '/'

export const parseEntryPath = (pathname = window.location.pathname): AppEntry => {
  const path = stripTrailing(pathname)

  if (path.startsWith('/receipt/')) {
    const receiptId = decodeURIComponent(path.slice('/receipt/'.length))
    return { kind: 'receipt', inviteCode: '', receiptId, noticeId: '' }
  }

  if (path.startsWith('/tenant/receipts/')) {
    const receiptId = decodeURIComponent(path.slice('/tenant/receipts/'.length))
    return { kind: 'receipt', inviteCode: '', receiptId, noticeId: '' }
  }

  if (path.startsWith('/notice/')) {
    const noticeId = decodeURIComponent(path.slice('/notice/'.length))
    return { kind: 'notice', inviteCode: '', receiptId: '', noticeId }
  }

  if (path.startsWith('/tenant/notices/')) {
    const noticeId = decodeURIComponent(path.slice('/tenant/notices/'.length))
    return { kind: 'notice', inviteCode: '', receiptId: '', noticeId }
  }

  if (path === '/join/tenant' || path.startsWith('/join/tenant/')) {
    const raw = path === '/join/tenant' ? '' : path.slice('/join/tenant/'.length)
    return { kind: 'join-tenant', inviteCode: normalizeInviteCode(decodeURIComponent(raw)), receiptId: '', noticeId: '' }
  }

  if (path === '/join/caretaker' || path.startsWith('/join/caretaker/')) {
    const raw = path === '/join/caretaker' ? '' : path.slice('/join/caretaker/'.length)
    return { kind: 'join-caretaker', inviteCode: normalizeInviteCode(decodeURIComponent(raw)), receiptId: '', noticeId: '' }
  }

  if (path === '/owner/signup' || path === '/signup') {
    return { kind: 'owner-signup', inviteCode: '', receiptId: '', noticeId: '' }
  }

  if (path === '/billing-admin') {
    return { kind: 'billing-admin', inviteCode: '', receiptId: '', noticeId: '' }
  }

  if (path === '/login' || path === '/owner' || path === '/') {
    return { kind: 'owner-login', inviteCode: '', receiptId: '', noticeId: '' }
  }

  // Legacy paths — map silently without exposing role names in redirects target
  if (path === '/staff/join' || path.startsWith('/staff/join/')) {
    const raw = path === '/staff/join' ? '' : path.slice('/staff/join/'.length)
    return { kind: 'join-caretaker', inviteCode: normalizeInviteCode(decodeURIComponent(raw)), receiptId: '', noticeId: '' }
  }
  if (path === '/join' || path.startsWith('/join/')) {
    const segment = path === '/join' ? '' : path.slice('/join/'.length)
    if (segment && !segment.startsWith('tenant/') && !segment.startsWith('caretaker/')) {
      return { kind: 'join-tenant', inviteCode: normalizeInviteCode(decodeURIComponent(segment)), receiptId: '', noticeId: '' }
    }
  }

  return { kind: 'owner-login', inviteCode: '', receiptId: '', noticeId: '' }
}

export const getTenantJoinPath = (code?: string): string =>
  code
    ? `/join/tenant/${encodeURIComponent(normalizeInviteCode(code))}`
    : '/join/tenant'

export const getCaretakerJoinPath = (code?: string): string =>
  code
    ? `/join/caretaker/${encodeURIComponent(normalizeInviteCode(code))}`
    : '/join/caretaker'

export const getOwnerLoginPath = (): string => '/login'

export const getOwnerSignupPath = (): string => '/owner/signup'

export const getBillingAdminPath = (): string => '/billing-admin'

export const getReceiptPath = (receiptId: string): string =>
  `/receipt/${encodeURIComponent(receiptId)}`

export const getTenantReceiptPath = (receiptId: string): string =>
  `/tenant/receipts/${encodeURIComponent(receiptId)}`

export const getNoticePath = (noticeId: string): string =>
  `/notice/${encodeURIComponent(noticeId)}`

export const getTenantNoticePath = (noticeId: string): string =>
  `/tenant/notices/${encodeURIComponent(noticeId)}`

export const getJoinUrl = (role: 'tenant' | 'caretaker', code: string): string => {
  const path = role === 'tenant' ? getTenantJoinPath(code) : getCaretakerJoinPath(code)
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export const entryKindForRole = (role: Role): EntryKind => {
  if (role === 'tenant') return 'join-tenant'
  if (role === 'caretaker') return 'join-caretaker'
  return 'owner-login'
}
