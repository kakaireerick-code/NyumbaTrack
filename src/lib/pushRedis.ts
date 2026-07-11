import { Redis } from '@upstash/redis'

export const redis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export const subIndexKey = (ownerId: string, role: string, userId: string) =>
  `push:index:${ownerId}:${role}:${userId}`

export const subDataKey = (endpoint: string) =>
  `push:sub:${Buffer.from(endpoint).toString('base64url')}`

export const vapidConfigured = () =>
  Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  )

/** Safe diagnostic — booleans only, never secret values */
export const vapidEnvStatus = () => ({
  publicKey: Boolean(process.env.VAPID_PUBLIC_KEY?.trim()),
  privateKey: Boolean(process.env.VAPID_PRIVATE_KEY?.trim()),
  subject: Boolean(process.env.VAPID_SUBJECT?.trim()),
})
