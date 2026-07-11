import { Redis } from '@upstash/redis'

/** Strip whitespace and accidental quotes from Vercel env values. */
export const cleanEnvValue = (value: string | undefined): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export const isRedisConfigured = (): boolean =>
  Boolean(
    cleanEnvValue(process.env.UPSTASH_REDIS_REST_URL) &&
      cleanEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN),
  )

/** Upstash may return JSON arrays as strings — normalize safely. */
export const asJsonArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

export const redis = () => {
  const url = cleanEnvValue(process.env.UPSTASH_REDIS_REST_URL)
  const token = cleanEnvValue(process.env.UPSTASH_REDIS_REST_TOKEN)
  if (!url || !token) return null
  return new Redis({ url, token })
}

export const subIndexKey = (ownerId: string, role: string, userId: string) =>
  `push:index:${ownerId}:${role}:${userId}`

export const subDataKey = (endpoint: string) =>
  `push:sub:${Buffer.from(endpoint).toString('base64url')}`

export const vapidConfigured = () =>
  Boolean(
    cleanEnvValue(process.env.VAPID_PUBLIC_KEY) &&
      cleanEnvValue(process.env.VAPID_PRIVATE_KEY) &&
      cleanEnvValue(process.env.VAPID_SUBJECT),
  )

/** Safe diagnostic — booleans only, never secret values */
export const vapidEnvStatus = () => ({
  publicKey: Boolean(cleanEnvValue(process.env.VAPID_PUBLIC_KEY)),
  privateKey: Boolean(cleanEnvValue(process.env.VAPID_PRIVATE_KEY)),
  subject: Boolean(cleanEnvValue(process.env.VAPID_SUBJECT)),
})
