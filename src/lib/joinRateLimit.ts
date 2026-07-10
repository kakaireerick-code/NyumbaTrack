import { safeGet, safeSet } from './storage'

const KEY = 'rt_join_attempts'
const MAX_ATTEMPTS = 5
const COOLDOWN_MS = 60_000

type AttemptState = { count: number; lockedUntil: number }

export const JOIN_COOLDOWN_MSG = 'Too many attempts. Please wait a minute and try again.'

export const checkJoinRateLimit = (): { ok: true } | { ok: false; error: string } => {
  const state = safeGet<AttemptState>(KEY, { count: 0, lockedUntil: 0 })
  const now = Date.now()
  if (state.lockedUntil > now) {
    return { ok: false, error: JOIN_COOLDOWN_MSG }
  }
  return { ok: true }
}

export const recordJoinFailure = (): void => {
  const state = safeGet<AttemptState>(KEY, { count: 0, lockedUntil: 0 })
  const count = state.count + 1
  if (count >= MAX_ATTEMPTS) {
    safeSet(KEY, { count: 0, lockedUntil: Date.now() + COOLDOWN_MS })
  } else {
    safeSet(KEY, { count, lockedUntil: 0 })
  }
}

export const clearJoinFailures = (): void => {
  safeSet(KEY, { count: 0, lockedUntil: 0 })
}
